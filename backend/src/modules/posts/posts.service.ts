import { PrismaClient } from "@prisma/client";
import { createHttpClient } from "../../shared/httpClient";
import { Result } from "../../shared/result";
import {
  AccountKind,
  PostCreateTargetInput,
  PostHistoryItem,
  PostTargetResult,
  PublishNowInput,
  ScheduleInput,
  UpdateScheduledInput,
} from "./posts.types";
import crypto from "crypto";
import { createInstagramRepository } from "../instagram/instagram.repository";
import { createInstagramService } from "../instagram/instagram.service";

type ServiceError = { message: string; code: number };

type PublishContext = {
  message: string;
  mediaType?: "IMAGE" | "VIDEO" | null;
  mediaUrl?: string | null;
  mediaUrls?: string[];
};

type ResolvedTarget = {
  kind: AccountKind;
  accountId: string;
  platform: string;
  accountLabel: string | null;
  publish: (ctx: PublishContext) => Promise<Result<{ externalPostId: string | null }, ServiceError>>;
};

type PostRow = {
  id: string;
  user_id: string;
  title: string | null;
  caption: string;
  hashtags: string | null;
  media_type: "IMAGE" | "VIDEO" | null;
  media_url: string | null;
  status: "SCHEDULED" | "PROCESSING" | "SUCCESS" | "FAILED" | "PARTIAL";
  created_at: Date;
  scheduled_at: Date | null;
  published_at: Date | null;
};

type TargetRow = {
  id: string;
  post_id: string;
  account_kind: AccountKind;
  account_ref_id: string;
  platform: string;
  account_label: string | null;
  status: "SCHEDULED" | "SUCCESS" | "FAILED";
  error_message: string | null;
  external_post_id: string | null;
  published_at: Date | null;
};

const facebookClient = createHttpClient("https://graph.facebook.com");
const instagramClient = createHttpClient("https://graph.facebook.com/v21.0");
const instagramService = createInstagramService(createInstagramRepository(instagramClient));

async function agentDebugLog(
  location: string,
  message: string,
  hypothesisId: string,
  data: Record<string, unknown>,
) {
  // #region agent log
  await fetch("http://127.0.0.1:7311/ingest/7b6a73b3-fd64-4de7-924b-ed2482dc7d12", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "68c34c",
    },
    body: JSON.stringify({
      sessionId: "68c34c",
      runId: "run1",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

async function publishToFacebook(pageId: string, pageAccessToken: string, message: string) {
  const result = await facebookClient.post<{ id?: string }>(
    `/v21.0/${pageId}/feed`,
    undefined,
    { params: { message, access_token: pageAccessToken } },
  );
  if (!result.ok) {
    const status = result.error.status;
    const data = result.error.data as { error?: { message?: string; code?: number } } | undefined;
    const graphMessage = data?.error?.message;
    const graphCode = data?.error?.code;
    if (status === 403) {
      return Result.fail<ServiceError>({
        message:
          "Facebook sayfa yayin izni yok (pages_manage_posts). Hesabi yeniden baglayip izinleri onaylayin.",
        code: 403,
      });
    }
    return Result.fail<ServiceError>({
      message:
        graphMessage ||
        `Facebook paylasimi basarisiz (status=${status}${graphCode ? `, code=${graphCode}` : ""}).`,
      code: status || 502,
    });
  }
  return Result.ok({ externalPostId: result.value.id ?? null });
}

function normalizeText(text: string | null | undefined): string {
  return (text ?? "").trim();
}

function buildPublishMessage(input: { title?: string; caption: string; hashtags?: string }): string {
  const blocks = [normalizeText(input.title), normalizeText(input.caption), normalizeText(input.hashtags)].filter(Boolean);
  return blocks.join("\n\n");
}

function decodeStoredMediaUrls(mediaUrl: string | null): string[] {
  if (!mediaUrl) return [];
  return mediaUrl
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function inferMediaTypeFromUrl(mediaUrl: string): "IMAGE" | "VIDEO" {
  const lower = mediaUrl.toLowerCase();
  if (lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.includes("/video/upload/")) return "VIDEO";
  return "IMAGE";
}

export const createPostsService = (db: PrismaClient) => ({
  async publishPostTargets(
    post: PostRow,
    targets: ResolvedTarget[],
    postTargetRows?: PostTargetResult[],
  ) {
    const ctx: PublishContext = {
      message: buildPublishMessage({
        title: post.title ?? undefined,
        caption: post.caption,
        hashtags: post.hashtags ?? undefined,
      }),
      mediaType: post.media_type,
      mediaUrl: post.media_url,
      mediaUrls: decodeStoredMediaUrls(post.media_url),
    };
    const targetRows: PostTargetResult[] = postTargetRows ?? [];
    if (targetRows.length === 0) {
      for (const t of targets) {
        const postTargetId = crypto.randomUUID();
        const inserted = await db.$queryRawUnsafe<TargetRow[]>(
          `INSERT INTO post_targets (
            id, post_id, account_kind, account_ref_id, platform, account_label, status, created_at, updated_at
           ) VALUES (
            $1, $2, $3, $4, $5, $6, 'SCHEDULED'::"PostTargetStatus", NOW(), NOW()
           ) RETURNING id, post_id, account_kind, account_ref_id, platform, account_label,
                     status::text as status, error_message, external_post_id, published_at`,
          postTargetId,
          post.id,
          t.kind,
          t.accountId,
          t.platform,
          t.accountLabel,
        );
        const row = inserted[0];
        targetRows.push({
          id: row.id,
          kind: row.account_kind,
          accountId: row.account_ref_id,
          platform: row.platform,
          accountLabel: row.account_label,
          status: row.status,
          errorMessage: row.error_message,
          externalPostId: row.external_post_id,
          publishedAt: row.published_at ? row.published_at.toISOString() : null,
        });
      }
    }

    for (const t of targets) {
      const tr = targetRows.find((x) => x.accountId === t.accountId && x.kind === t.kind);
      if (!tr) continue;
      const publishResult = await t.publish(ctx);
      if (publishResult.ok) {
        await db.$executeRawUnsafe(
          `UPDATE post_targets
           SET status = 'SUCCESS'::"PostTargetStatus", error_message = NULL, external_post_id = $1, published_at = NOW(), updated_at = NOW()
           WHERE id = $2`,
          publishResult.value.externalPostId,
          tr.id,
        );
        tr.status = "SUCCESS";
        tr.externalPostId = publishResult.value.externalPostId;
        tr.errorMessage = null;
        tr.publishedAt = new Date().toISOString();
      } else {
        await db.$executeRawUnsafe(
          `UPDATE post_targets
           SET status = 'FAILED'::"PostTargetStatus", error_message = $1, updated_at = NOW()
           WHERE id = $2`,
          publishResult.error.message,
          tr.id,
        );
        tr.status = "FAILED";
        tr.errorMessage = publishResult.error.message;
      }
    }

    const successCount = targetRows.filter((x) => x.status === "SUCCESS").length;
    const failedCount = targetRows.length - successCount;
    const overall: PostHistoryItem["status"] =
      successCount === targetRows.length ? "SUCCESS" : successCount === 0 ? "FAILED" : "PARTIAL";

    await db.$executeRawUnsafe(
      `UPDATE posts
       SET status = $1::"PostStatus", published_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      overall,
      post.id,
    );

    return { overall, successCount, failedCount, targets: targetRows };
  },

  async publishNow(userId: string, input: PublishNowInput) {
    const resolved = await this.resolveTargets(userId, input.targets);
    if (!resolved.ok) return resolved;

    const targets = this.bindPublishMessage(resolved.value);
    if (targets.length === 0) {
      return Result.fail<ServiceError>({ message: "Gecerli hedef hesap bulunamadi.", code: 400 });
    }

    const postId = crypto.randomUUID();
    const postRows = await db.$queryRawUnsafe<PostRow[]>(
      `INSERT INTO posts (id, user_id, title, caption, hashtags, media_type, media_url, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PROCESSING'::"PostStatus", NOW(), NOW())
       RETURNING id, user_id, title, caption, hashtags, media_type, media_url, status::text as status, created_at, scheduled_at, published_at`,
      postId,
      userId,
      normalizeText(input.title) || null,
      normalizeText(input.caption),
      normalizeText(input.hashtags) || null,
      input.mediaType ?? null,
      (input.mediaUrls && input.mediaUrls.length > 0 ? input.mediaUrls.join("\n") : input.mediaUrl) ?? null,
    );
    const post = postRows[0];
    const { overall, successCount, failedCount, targets: targetRows } = await this.publishPostTargets(post, targets);

    return Result.ok({
      id: post.id,
      status: overall,
      successCount,
      failedCount,
      targets: targetRows,
      message:
        overall === "SUCCESS"
          ? "Gonderi secilen tum hesaplarda paylasildi."
          : overall === "PARTIAL"
            ? "Gonderi bazi hesaplarda paylasildi, bazilari basarisiz oldu."
            : "Gonderi hicbir hesapta paylasilamadi.",
    });
  },

  async schedule(userId: string, input: ScheduleInput) {
    const resolved = await this.resolveTargets(userId, input.targets);
    if (!resolved.ok) return resolved;
    const targets = resolved.value;
    if (targets.length === 0) {
      return Result.fail<ServiceError>({ message: "Gecerli hedef hesap bulunamadi.", code: 400 });
    }

    const postId = crypto.randomUUID();
    const rows = await db.$queryRawUnsafe<PostRow[]>(
      `INSERT INTO posts (
        id, user_id, title, caption, hashtags, media_type, media_url, scheduled_at, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 'SCHEDULED'::"PostStatus", NOW(), NOW()
      ) RETURNING id, user_id, title, caption, hashtags, media_type, media_url, status::text as status, created_at, scheduled_at, published_at`,
      postId,
      userId,
      normalizeText(input.title) || null,
      normalizeText(input.caption),
      normalizeText(input.hashtags) || null,
      input.mediaType ?? null,
      (input.mediaUrls && input.mediaUrls.length > 0 ? input.mediaUrls.join("\n") : input.mediaUrl) ?? null,
      new Date(input.scheduledAt),
    );
    const post = rows[0];

    for (const t of targets) {
      const targetId = crypto.randomUUID();
      await db.$executeRawUnsafe(
        `INSERT INTO post_targets (
          id, post_id, account_kind, account_ref_id, platform, account_label, status, created_at, updated_at
         ) VALUES (
          $1, $2, $3, $4, $5, $6, 'SCHEDULED'::"PostTargetStatus", NOW(), NOW()
         )`,
        targetId,
        post.id,
        t.kind,
        t.accountId,
        t.platform,
        t.accountLabel,
      );
    }

    return Result.ok({
      id: post.id,
      status: "SCHEDULED" as const,
      scheduledAt: post.scheduled_at?.toISOString() ?? null,
      message: "Gonderi planlandi.",
    });
  },

  async updateScheduled(userId: string, postId: string, input: UpdateScheduledInput) {
    const existing = await db.$queryRawUnsafe<PostRow[]>(
      `SELECT id, user_id, title, caption, hashtags, media_type, media_url, status::text as status, created_at, scheduled_at, published_at
       FROM posts
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      postId,
      userId,
    );
    const post = existing[0];
    if (!post) {
      return Result.fail<ServiceError>({ message: "Gonderi bulunamadi.", code: 404 });
    }
    if (post.status !== "SCHEDULED") {
      return Result.fail<ServiceError>({ message: "Sadece planli gonderiler guncellenebilir.", code: 400 });
    }
    const resolved = await this.resolveTargets(userId, input.targets);
    if (!resolved.ok) return resolved;
    const targets = resolved.value;
    if (targets.length === 0) {
      return Result.fail<ServiceError>({ message: "Gecerli hedef hesap bulunamadi.", code: 400 });
    }

    await db.$executeRawUnsafe(
      `UPDATE posts
       SET title = $1, caption = $2, hashtags = $3, scheduled_at = $4, updated_at = NOW()
       WHERE id = $5`,
      normalizeText(input.title) || null,
      normalizeText(input.caption),
      normalizeText(input.hashtags) || null,
      new Date(input.scheduledAt),
      postId,
    );
    await db.$executeRawUnsafe(`DELETE FROM post_targets WHERE post_id = $1`, postId);
    for (const t of targets) {
      await db.$executeRawUnsafe(
        `INSERT INTO post_targets (
          id, post_id, account_kind, account_ref_id, platform, account_label, status, created_at, updated_at
         ) VALUES (
          $1, $2, $3, $4, $5, $6, 'SCHEDULED'::"PostTargetStatus", NOW(), NOW()
         )`,
        crypto.randomUUID(),
        postId,
        t.kind,
        t.accountId,
        t.platform,
        t.accountLabel,
      );
    }

    return Result.ok({ id: postId, message: "Planli gonderi guncellendi." });
  },

  async deletePost(userId: string, postId: string) {
    const deleted = await db.$executeRawUnsafe(
      `DELETE FROM posts
       WHERE id = $1 AND user_id = $2`,
      postId,
      userId,
    );
    if (!deleted) {
      return Result.fail<ServiceError>({ message: "Gonderi bulunamadi.", code: 404 });
    }
    return Result.ok({ id: postId, message: "Gonderi silindi." });
  },

  async listHistory(userId: string) {
    const posts = await db.$queryRawUnsafe<PostRow[]>(
      `SELECT id, user_id, title, caption, hashtags, media_type, media_url, status::text as status, created_at, scheduled_at, published_at
       FROM posts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      userId,
    );
    const targetsByPost = await this.getTargetsByPostIds(posts.map((p) => p.id));
    return Result.ok(
      posts.map((p) => ({
        id: p.id,
        title: p.title,
        caption: p.caption,
        hashtags: p.hashtags,
        status: p.status,
        createdAt: p.created_at.toISOString(),
        scheduledAt: p.scheduled_at ? p.scheduled_at.toISOString() : null,
        publishedAt: p.published_at ? p.published_at.toISOString() : null,
        targets: targetsByPost[p.id] ?? [],
      })),
    );
  },

  async listScheduled(userId: string) {
    const posts = await db.$queryRawUnsafe<PostRow[]>(
      `SELECT id, user_id, title, caption, hashtags, media_type, media_url, status::text as status, created_at, scheduled_at, published_at
       FROM posts
       WHERE user_id = $1 AND status = 'SCHEDULED'::"PostStatus"
       ORDER BY scheduled_at ASC NULLS LAST, created_at DESC`,
      userId,
    );
    const targetsByPost = await this.getTargetsByPostIds(posts.map((p) => p.id));
    return Result.ok(
      posts.map((p) => ({
        id: p.id,
        title: p.title,
        caption: p.caption,
        hashtags: p.hashtags,
        status: p.status,
        createdAt: p.created_at.toISOString(),
        scheduledAt: p.scheduled_at ? p.scheduled_at.toISOString() : null,
        publishedAt: p.published_at ? p.published_at.toISOString() : null,
        targets: targetsByPost[p.id] ?? [],
      })),
    );
  },

  async getTargetsByPostIds(postIds: string[]) {
    if (postIds.length === 0) return {} as Record<string, PostTargetResult[]>;
    const rows = await db.$queryRawUnsafe<TargetRow[]>(
      `SELECT id, post_id, account_kind, account_ref_id, platform, account_label,
              status::text as status, error_message, external_post_id, published_at
       FROM post_targets
       WHERE post_id = ANY($1)
       ORDER BY created_at ASC`,
      postIds,
    );

    const map: Record<string, PostTargetResult[]> = {};
    for (const row of rows) {
      if (!map[row.post_id]) map[row.post_id] = [];
      map[row.post_id].push({
        id: row.id,
        kind: row.account_kind,
        accountId: row.account_ref_id,
        platform: row.platform,
        accountLabel: row.account_label,
        status: row.status,
        errorMessage: row.error_message,
        externalPostId: row.external_post_id,
        publishedAt: row.published_at ? row.published_at.toISOString() : null,
      });
    }
    return map;
  },

  async resolveTargets(userId: string, targets: PostCreateTargetInput[]) {
    const resolved: ResolvedTarget[] = [];

    for (const t of targets) {
      if (t.kind === "instagram") {
        const ig = await db.instagramAccount.findFirst({ where: { id: t.accountId, userId } });
        if (!ig) continue;
        resolved.push({
          kind: "instagram",
          accountId: ig.id,
          platform: "instagram",
          accountLabel: ig.name || ig.username || `IG ${ig.instagramUserId}`,
          publish: async (ctx) => {
            if (!ctx.mediaUrl) {
              return Result.fail({ message: "Instagram icin mediaUrl zorunludur.", code: 400 });
            }
            await agentDebugLog("posts.service.ts:instagramPublish", "Instagram publish input", "H2", {
              mediaType: ctx.mediaType ?? "IMAGE",
              mediaUrl: ctx.mediaUrl,
              captionLength: ctx.message.length,
            });
            try {
              const head = await fetch(ctx.mediaUrl, { method: "HEAD" });
              await agentDebugLog("posts.service.ts:instagramPublish", "HEAD response for media URL", "H1", {
                status: head.status,
                contentType: head.headers.get("content-type"),
                contentLength: head.headers.get("content-length"),
                finalUrl: head.url,
              });
            } catch (error) {
              await agentDebugLog("posts.service.ts:instagramPublish", "HEAD request failed", "H1", {
                error: error instanceof Error ? error.message : "unknown",
              });
            }
            const mediaUrls = ctx.mediaUrls && ctx.mediaUrls.length > 0 ? ctx.mediaUrls : [ctx.mediaUrl];
            if (mediaUrls.length > 1) {
              const r = await instagramService.publishMedia(
                { accessToken: ig.accessToken, businessAccountId: ig.businessAccountId },
                {
                  mediaType: "CAROUSEL",
                  mediaUrls,
                  caption: ctx.message,
                },
              );
              if (!r.ok) {
                await agentDebugLog("posts.service.ts:instagramPublish", "Instagram publish failed", "H4", {
                  code: r.error.code,
                  type: r.error.type,
                  message: r.error.message,
                });
                return Result.fail({ message: r.error.message, code: r.error.code || 502 });
              }
              return Result.ok({ externalPostId: r.value.mediaId });
            }
            const mediaUrl = mediaUrls[0];
            const r = await instagramService.publishMedia(
              { accessToken: ig.accessToken, businessAccountId: ig.businessAccountId },
              {
                mediaType: ctx.mediaType ?? inferMediaTypeFromUrl(mediaUrl),
                mediaUrl,
                caption: ctx.message,
              },
            );
            if (!r.ok) {
              await agentDebugLog("posts.service.ts:instagramPublish", "Instagram publish failed", "H4", {
                code: r.error.code,
                type: r.error.type,
                message: r.error.message,
              });
              return Result.fail({ message: r.error.message, code: r.error.code || 502 });
            }
            return Result.ok({ externalPostId: r.value.mediaId });
          },
        });
        continue;
      }

      if (t.kind === "facebook") {
        const fb = await db.facebookPageAccount.findFirst({ where: { id: t.accountId, userId } });
        if (!fb) continue;
        resolved.push({
          kind: "facebook",
          accountId: fb.id,
          platform: "facebook",
          accountLabel: fb.pageName,
          publish: async () => Result.fail({ message: "Internal publisher not bound", code: 500 }),
        });
        continue;
      }

      const sc = await db.socialConnection.findFirst({ where: { id: t.accountId, userId } });
      if (!sc) continue;
      resolved.push({
        kind: "social",
        accountId: sc.id,
        platform: sc.platform,
        accountLabel: sc.displayName,
        publish: async () =>
          Result.fail({ message: `${sc.platform} paylasimi henuz desteklenmiyor.`, code: 400 }),
      });
    }

    for (const item of resolved) {
      if (item.kind !== "facebook") continue;
      const fb = await db.facebookPageAccount.findFirst({ where: { id: item.accountId, userId } });
      if (!fb) {
        item.publish = async () => Result.fail({ message: "Hesap bulunamadi", code: 404 });
        continue;
      }
      item.publish = async (ctx) => publishToFacebook(fb.pageId, fb.pageAccessToken, ctx.message);
    }

    return Result.ok(resolved);
  },

  bindPublishMessage(targets: ResolvedTarget[]): ResolvedTarget[] {
    return targets;
  },

  async processDueScheduled(limit = 10) {
    const duePosts = await db.$queryRawUnsafe<PostRow[]>(
      `SELECT id, user_id, title, caption, hashtags, media_type, media_url, status::text as status, created_at, scheduled_at, published_at
       FROM posts
       WHERE status = 'SCHEDULED'::"PostStatus" AND scheduled_at <= NOW()
       ORDER BY scheduled_at ASC
       LIMIT $1`,
      limit,
    );
    for (const post of duePosts) {
      await db.$executeRawUnsafe(
        `UPDATE posts
         SET status = 'PROCESSING'::"PostStatus", updated_at = NOW()
         WHERE id = $1 AND status = 'SCHEDULED'::"PostStatus"`,
        post.id,
      );
      const targetRows = await db.$queryRawUnsafe<TargetRow[]>(
        `SELECT id, post_id, account_kind, account_ref_id, platform, account_label,
                status::text as status, error_message, external_post_id, published_at
         FROM post_targets
         WHERE post_id = $1
         ORDER BY created_at ASC`,
        post.id,
      );
      const targetInputs: PostCreateTargetInput[] = targetRows.map((x) => ({
        accountId: x.account_ref_id,
        kind: x.account_kind,
      }));
      const resolved = await this.resolveTargets(post.user_id, targetInputs);
      if (!resolved.ok) {
        await db.$executeRawUnsafe(
          `UPDATE posts
           SET status = 'FAILED'::"PostStatus", updated_at = NOW()
           WHERE id = $1`,
          post.id,
        );
        continue;
      }
      const existingTargets: PostTargetResult[] = targetRows.map((row) => ({
        id: row.id,
        kind: row.account_kind,
        accountId: row.account_ref_id,
        platform: row.platform,
        accountLabel: row.account_label,
        status: row.status,
        errorMessage: row.error_message,
        externalPostId: row.external_post_id,
        publishedAt: row.published_at ? row.published_at.toISOString() : null,
      }));
      await this.publishPostTargets(post, this.bindPublishMessage(resolved.value), existingTargets);
    }
  },
});

export type PostsService = ReturnType<typeof createPostsService>;
