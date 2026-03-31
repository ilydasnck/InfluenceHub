import { Request, Response } from "express";
import type { PrismaClient } from "@prisma/client";
import type { AuthService } from "../auth/auth.service";
import { verifyAuthToken } from "../../shared/jwt";
import {
  computeFollowerMetrics,
  deleteSnapshotsForAccount,
  upsertDailySnapshots,
} from "./followerMetrics";

type PlatformKey = "instagram" | "facebook" | "youtube" | "tiktok";

const STUB_DEFAULTS: Record<
  Exclude<PlatformKey, "instagram" | "facebook">,
  { displayName: string; handle: string; followerCount: number }
> = {
  youtube: {
    displayName: "YouTube Channel",
    handle: "@yourchannel",
    followerCount: 20000,
  },
  tiktok: {
    displayName: "TikTok",
    handle: "@yourtiktok",
    followerCount: 3500,
  },
};

function getUserId(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return null;
  }
  const p = verifyAuthToken(auth.slice(7));
  return p?.sub ?? null;
}

export const createAccountsController = (
  db: PrismaClient,
  authService: AuthService,
) => ({
  async list(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Yetkisiz" });
      return;
    }

    const forceRefresh =
      req.query.refresh === "1" || req.query.refresh === "true";

    let instagramRows = await db.instagramAccount.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    await Promise.allSettled(
      instagramRows.map((row) =>
        authService.refreshInstagramAccountFromGraph(
          {
            id: row.id,
            instagramUserId: row.instagramUserId,
            accessToken: row.accessToken,
            tokenExpiresAt: row.tokenExpiresAt,
            lastProfileSyncedAt: row.lastProfileSyncedAt,
          },
          { forceSync: forceRefresh },
        ),
      ),
    );

    let facebookRows = await db.facebookPageAccount.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    await Promise.allSettled(
      facebookRows.map((row) =>
        authService.refreshFacebookPageAccountFromGraph(
          {
            id: row.id,
            pageId: row.pageId,
            pageAccessToken: row.pageAccessToken,
            lastProfileSyncedAt: row.lastProfileSyncedAt,
          },
          { forceSync: forceRefresh },
        ),
      ),
    );

    const [instagramFresh, facebookFresh, socialRows] = await Promise.all([
      db.instagramAccount.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      db.facebookPageAccount.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      db.socialConnection.findMany({
        where: {
          userId,
          platform: { in: ["youtube", "tiktok"] },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    instagramRows = instagramFresh;
    facebookRows = facebookFresh;

    const instagramMapped = instagramRows.map((a) => {
      const displayName =
        (a.name && a.name.trim()) ||
        a.username ||
        "Instagram";
      const handle = a.username
        ? `@${a.username}`
        : `@ig_${a.instagramUserId.slice(0, 10)}`;
      return {
        id: a.id,
        kind: "instagram" as const,
        platform: "instagram" as const,
        displayName,
        handle,
        followerCount: a.followersCount ?? 0,
        avatarUrl: a.profilePictureUrl ?? null,
      };
    });

    const facebookMapped = facebookRows.map((a) => {
      const handleFromLink =
        a.pageLink != null && a.pageLink.length > 0
          ? a.pageLink.replace(/^https?:\/\/(www\.)?facebook\.com\//i, "")
          : null;
      return {
        id: a.id,
        kind: "facebook" as const,
        platform: "facebook" as const,
        displayName: a.pageName,
        handle: handleFromLink ? `@${handleFromLink}` : `Facebook · ${a.pageId}`,
        followerCount: a.fanCount,
        avatarUrl: a.pictureUrl ?? null,
      };
    });

    const socialMapped = socialRows.map((a) => ({
      id: a.id,
      kind: "social" as const,
      platform: a.platform as PlatformKey,
      displayName: a.displayName,
      handle: a.handle,
      followerCount: a.followerCount,
      avatarUrl: a.avatarUrl,
    }));

    const all = [...instagramMapped, ...facebookMapped, ...socialMapped];

    await upsertDailySnapshots(
      db,
      userId,
      all.map((a) => ({
        kind: a.kind,
        refId: a.id,
        count: a.followerCount,
      })),
    );

    const metricInputs = all.map((a) => ({
      id: a.id,
      kind: a.kind,
      platform: a.platform,
      displayName: a.displayName,
      followerCount: a.followerCount,
    }));

    const { weeklyDeltas, growth } = await computeFollowerMetrics(
      db,
      userId,
      metricInputs,
    );

    const allWithWeekly = all.map((a) => ({
      ...a,
      weeklyDelta: weeklyDeltas.get(a.id) ?? null,
    }));

    const totalFollowers = allWithWeekly.reduce((s, a) => s + a.followerCount, 0);
    const platformSet = new Set(allWithWeekly.map((a) => a.platform));

    const order: PlatformKey[] = ["instagram", "facebook", "youtube", "tiktok"];
    const groups = order
      .map((platform) => {
        const accounts = allWithWeekly.filter((a) => a.platform === platform);
        if (accounts.length === 0) {
          return null;
        }
        return {
          platform,
          accounts,
          countLabel: accounts.length,
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);

    res.json({
      data: {
        stats: {
          totalAccounts: allWithWeekly.length,
          totalFollowers,
          platformCount: platformSet.size,
        },
        growth,
        groups,
      },
    });
  },

  async connect(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Yetkisiz" });
      return;
    }

    const body = req.body as { platform?: unknown };
    const platform = body.platform;
    if (
      platform !== "instagram" &&
      platform !== "facebook" &&
      platform !== "youtube" &&
      platform !== "tiktok"
    ) {
      res.status(400).json({ error: "Geçersiz platform" });
      return;
    }

    if (platform === "instagram") {
      const base =
        process.env.PUBLIC_API_URL?.replace(/\/$/, "") ||
        `${req.protocol}://${req.get("host")}`;
      res.json({
        data: {
          flow: "oauth_instagram",
          oauthUrl: `${base}/api/auth/instagram`,
        },
      });
      return;
    }

    if (platform === "facebook") {
      const base =
        process.env.PUBLIC_API_URL?.replace(/\/$/, "") ||
        `${req.protocol}://${req.get("host")}`;
      res.json({
        data: {
          flow: "oauth_facebook",
          oauthUrl: `${base}/api/auth/facebook`,
        },
      });
      return;
    }

    const defaults = STUB_DEFAULTS[platform];
    try {
      const created = await db.socialConnection.upsert({
        where: {
          userId_platform: { userId, platform },
        },
        create: {
          userId,
          platform,
          displayName: defaults.displayName,
          handle: defaults.handle,
          followerCount: defaults.followerCount,
        },
        update: {
          displayName: defaults.displayName,
          handle: defaults.handle,
        },
      });

      res.status(201).json({
        data: {
          flow: "stub",
          account: {
            id: created.id,
            kind: "social" as const,
            platform: created.platform as PlatformKey,
            displayName: created.displayName,
            handle: created.handle,
            followerCount: created.followerCount,
            avatarUrl: created.avatarUrl,
          },
        },
      });
    } catch {
      res.status(500).json({ error: "Bağlantı kaydedilemedi" });
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Yetkisiz" });
      return;
    }

    const id = String(req.params.id ?? "");
    const kindRaw = req.query.kind;
    const kind = String(Array.isArray(kindRaw) ? kindRaw[0] : kindRaw ?? "");
    if (
      kind !== "instagram" &&
      kind !== "facebook" &&
      kind !== "social"
    ) {
      res.status(400).json({
        error: "kind=instagram, kind=facebook veya kind=social gerekli",
      });
      return;
    }

    if (kind === "instagram") {
      const row = await db.instagramAccount.findFirst({
        where: { id, userId },
      });
      if (!row) {
        res.status(404).json({ error: "Hesap bulunamadı" });
        return;
      }
      await deleteSnapshotsForAccount(db, userId, "instagram", id);
      await db.instagramAccount.delete({ where: { id } });
      res.status(204).send();
      return;
    }

    if (kind === "facebook") {
      const row = await db.facebookPageAccount.findFirst({
        where: { id, userId },
      });
      if (!row) {
        res.status(404).json({ error: "Hesap bulunamadı" });
        return;
      }
      await deleteSnapshotsForAccount(db, userId, "facebook", id);
      await db.facebookPageAccount.delete({ where: { id } });
      res.status(204).send();
      return;
    }

    const row = await db.socialConnection.findFirst({
      where: { id, userId },
    });
    if (!row) {
      res.status(404).json({ error: "Hesap bulunamadı" });
      return;
    }
    await deleteSnapshotsForAccount(db, userId, "social", id);
    await db.socialConnection.delete({ where: { id } });
    res.status(204).send();
  },
});

export type AccountsController = ReturnType<typeof createAccountsController>;
