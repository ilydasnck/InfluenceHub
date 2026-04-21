import { Request, Response } from "express";
import { verifyAuthToken } from "../../shared/jwt";
import { PostsService } from "./posts.service";
import { PublishNowInput, ScheduleInput } from "./posts.types";
import path from "path";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import sharp from "sharp";

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

function getUserId(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const payload = verifyAuthToken(auth.slice(7));
  return payload?.sub ?? null;
}

function hasContent(input: { title?: string; caption?: string; hashtags?: string }): boolean {
  return Boolean((input.caption ?? "").trim() || (input.title ?? "").trim());
}

function normalizeTargets(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => ({
      kind: String((x as { kind?: string }).kind || "") as "instagram" | "facebook" | "social",
      accountId: String((x as { accountId?: string }).accountId || ""),
    }))
    .filter((x) =>
      ["instagram", "facebook", "social"].includes(x.kind) && x.accountId.length > 0,
    );
}

function extFromMime(mimeType: string): string | null {
  const normalized = mimeType.toLowerCase().trim();
  if (normalized === "image/jpeg" || normalized === "image/jpg") return ".jpg";
  if (normalized === "image/png") return ".png";
  if (normalized === "video/mp4") return ".mp4";
  if (normalized === "video/quicktime") return ".mov";
  return null;
}

function isLocalOrPrivateUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.startsWith("172.16.") ||
      host.startsWith("172.17.") ||
      host.startsWith("172.18.") ||
      host.startsWith("172.19.") ||
      host.startsWith("172.2") ||
      host.startsWith("172.30.") ||
      host.startsWith("172.31.")
    );
  } catch {
    return true;
  }
}

function resolvePublicApiUrlForInstagram(): string {
  const raw = (process.env.PUBLIC_API_URL ?? "").trim();
  if (!raw) {
    throw new Error(
      "Instagram medya paylasimi icin PUBLIC_API_URL zorunludur. Lutfen herkese acik HTTPS bir URL tanimlayin (or. ngrok/cloudflare tunnel).",
    );
  }
  if (isLocalOrPrivateUrl(raw)) {
    throw new Error(
      "PUBLIC_API_URL yerel/private adres olamaz. Instagram medyayi cekebilmek icin herkese acik HTTPS URL gerektirir.",
    );
  }
  return raw.replace(/\/$/, "");
}

async function persistMediaBase64(
  media: { name: string; mimeType: string; base64: string },
  publicApiUrl: string,
): Promise<string> {
  const extension = extFromMime(media.mimeType);
  if (!extension) {
    throw new Error(
      "Desteklenmeyen medya tipi. Instagram icin JPEG/PNG gorsel veya MP4/MOV video secin.",
    );
  }
  const uploadDir = path.resolve(process.cwd(), "public", "uploads", "posts");
  await mkdir(uploadDir, { recursive: true });
  const fileId = crypto.randomUUID();
  const fileName = `${fileId}${extension}`;
  const absPath = path.join(uploadDir, fileName);
  const parts = media.base64.split(",");
  const data = parts.length > 1 ? parts[parts.length - 1] ?? "" : media.base64;
  const binary = Buffer.from(data, "base64");
  await writeFile(absPath, binary);
  const mediaUrl = `${publicApiUrl}/uploads/posts/${fileName}`;
  await agentDebugLog("posts.controller.ts:persistMediaBase64", "Media persisted", "H3", {
    mimeType: media.mimeType,
    extension,
    bytes: binary.byteLength,
    mediaUrl,
  });
  return mediaUrl;
}

async function uploadToCloudinary(
  media: { name: string; mimeType: string },
  binary: Buffer,
): Promise<string | null> {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();
  const uploadPreset = (process.env.CLOUDINARY_UPLOAD_PRESET ?? "").trim();
  if (!cloudName || !uploadPreset) return null;

  const resourceType = media.mimeType.startsWith("video/") ? "video" : "image";
  const form = new FormData();
  form.append("upload_preset", uploadPreset);
  form.append("folder", "influencehub/posts");
  form.append(
    "file",
    new Blob([new Uint8Array(binary)], { type: media.mimeType }),
    media.name || "upload",
  );

  const resp = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`,
    {
      method: "POST",
      body: form,
    },
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Cloudinary upload basarisiz: ${text.slice(0, 250)}`);
  }
  const json = (await resp.json()) as { secure_url?: string };
  if (!json.secure_url) {
    throw new Error("Cloudinary secure_url donmedi.");
  }
  return json.secure_url;
}

async function normalizeInstagramImage(
  binary: Buffer,
): Promise<{ binary: Buffer; mimeType: string }> {
  const image = sharp(binary, { failOn: "none" });
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) {
    return { binary, mimeType: "image/jpeg" };
  }

  const minRatio = 4 / 5;
  const maxRatio = 1.91 / 1;
  const ratio = width / height;

  let cropWidth = width;
  let cropHeight = height;

  if (ratio < minRatio) {
    cropHeight = Math.round(width / minRatio);
  } else if (ratio > maxRatio) {
    cropWidth = Math.round(height * maxRatio);
  }

  const left = Math.max(0, Math.floor((width - cropWidth) / 2));
  const top = Math.max(0, Math.floor((height - cropHeight) / 2));

  const normalized = await sharp(binary)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize({ width: Math.min(1080, cropWidth), height: Math.min(1350, cropHeight), fit: "inside" })
    .jpeg({ quality: 90 })
    .toBuffer();

  return { binary: normalized, mimeType: "image/jpeg" };
}

export const createPostsController = (service: PostsService) => ({
  async publishNow(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Yetkisiz" });
      return;
    }

    const body = req.body as Partial<PublishNowInput>;
    const payload: PublishNowInput = {
      title: body.title,
      caption: String(body.caption ?? ""),
      hashtags: body.hashtags,
      mediaType: body.mediaType ?? null,
      mediaUrl: body.mediaUrl ?? null,
      media: body.media ?? null,
      medias: Array.isArray(body.medias) ? body.medias : [],
      targets: normalizeTargets(body.targets),
    };
    const sourceMedias = payload.medias && payload.medias.length > 0 ? payload.medias : payload.media ? [payload.media] : [];
    const mediaUrls: string[] = [];
    if (!payload.mediaUrl && sourceMedias.length > 0) {
      try {
        const hasInstagram = payload.targets.some((x) => x.kind === "instagram");
        for (const mediaItem of sourceMedias) {
          const parts = mediaItem.base64.split(",");
          const data = parts.length > 1 ? parts[parts.length - 1] ?? "" : mediaItem.base64;
          let binary = Buffer.from(data, "base64");
          let effectiveMedia = mediaItem;
          if (hasInstagram && mediaItem.mimeType.startsWith("image/")) {
            const normalized = await normalizeInstagramImage(binary);
            binary = Buffer.from(normalized.binary);
            effectiveMedia = { ...mediaItem, mimeType: normalized.mimeType };
          }
          if (hasInstagram) {
            const cloudinaryUrl = await uploadToCloudinary(effectiveMedia, binary);
            if (cloudinaryUrl) {
              mediaUrls.push(cloudinaryUrl);
              continue;
            }
            const apiBase = resolvePublicApiUrlForInstagram();
            mediaUrls.push(await persistMediaBase64({ ...effectiveMedia, base64: binary.toString("base64") }, apiBase));
          } else {
            const apiBase = (process.env.PUBLIC_API_URL ?? "http://127.0.0.1:5000").replace(/\/$/, "");
            mediaUrls.push(await persistMediaBase64({ ...effectiveMedia, base64: binary.toString("base64") }, apiBase));
          }
        }
      } catch (error) {
        await agentDebugLog("posts.controller.ts:publishNow", "Media persist/public URL error", "H1", {
          error: error instanceof Error ? error.message : "unknown",
          hasInstagram: payload.targets.some((x) => x.kind === "instagram"),
        });
        res.status(400).json({ error: error instanceof Error ? error.message : "Medya yuklenemedi." });
        return;
      }
    }
    payload.mediaUrls = mediaUrls;
    if (!payload.mediaUrl && mediaUrls.length > 0) payload.mediaUrl = mediaUrls[0];

    if (!hasContent(payload)) {
      res.status(400).json({ error: "??erik girmeden payla??m ba?lat?lamaz." });
      return;
    }
    if (payload.targets.length < 1) {
      res.status(400).json({ error: "En az bir hesap se?melisiniz." });
      return;
    }

    const result = await service.publishNow(userId, payload);
    if (!result.ok) {
      res.status(result.error.code).json({ error: result.error.message });
      return;
    }
    res.json({ data: result.value });
  },

  async schedule(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Yetkisiz" });
      return;
    }

    const body = req.body as Partial<ScheduleInput>;
    const payload: ScheduleInput = {
      title: body.title,
      caption: String(body.caption ?? ""),
      hashtags: body.hashtags,
      mediaType: body.mediaType ?? null,
      mediaUrl: body.mediaUrl ?? null,
      media: body.media ?? null,
      medias: Array.isArray(body.medias) ? body.medias : [],
      scheduledAt: String(body.scheduledAt ?? ""),
      targets: normalizeTargets(body.targets),
    };
    const sourceMedias = payload.medias && payload.medias.length > 0 ? payload.medias : payload.media ? [payload.media] : [];
    const mediaUrls: string[] = [];
    if (!payload.mediaUrl && sourceMedias.length > 0) {
      try {
        const hasInstagram = payload.targets.some((x) => x.kind === "instagram");
        for (const mediaItem of sourceMedias) {
          const parts = mediaItem.base64.split(",");
          const data = parts.length > 1 ? parts[parts.length - 1] ?? "" : mediaItem.base64;
          let binary = Buffer.from(data, "base64");
          let effectiveMedia = mediaItem;
          if (hasInstagram && mediaItem.mimeType.startsWith("image/")) {
            const normalized = await normalizeInstagramImage(binary);
            binary = Buffer.from(normalized.binary);
            effectiveMedia = { ...mediaItem, mimeType: normalized.mimeType };
          }
          if (hasInstagram) {
            const cloudinaryUrl = await uploadToCloudinary(effectiveMedia, binary);
            if (cloudinaryUrl) {
              mediaUrls.push(cloudinaryUrl);
              continue;
            }
            const apiBase = resolvePublicApiUrlForInstagram();
            mediaUrls.push(await persistMediaBase64({ ...effectiveMedia, base64: binary.toString("base64") }, apiBase));
          } else {
            const apiBase = (process.env.PUBLIC_API_URL ?? "http://127.0.0.1:5000").replace(/\/$/, "");
            mediaUrls.push(await persistMediaBase64({ ...effectiveMedia, base64: binary.toString("base64") }, apiBase));
          }
        }
      } catch (error) {
        await agentDebugLog("posts.controller.ts:schedule", "Media persist/public URL error", "H1", {
          error: error instanceof Error ? error.message : "unknown",
          hasInstagram: payload.targets.some((x) => x.kind === "instagram"),
        });
        res.status(400).json({ error: error instanceof Error ? error.message : "Medya yuklenemedi." });
        return;
      }
    }
    payload.mediaUrls = mediaUrls;
    if (!payload.mediaUrl && mediaUrls.length > 0) payload.mediaUrl = mediaUrls[0];

    if (!hasContent(payload)) {
      res.status(400).json({ error: "??erik girmeden planlama ba?lat?lamaz." });
      return;
    }
    if (payload.targets.length < 1) {
      res.status(400).json({ error: "En az bir hesap se?melisiniz." });
      return;
    }

    const when = new Date(payload.scheduledAt);
    if (!payload.scheduledAt || Number.isNaN(when.getTime())) {
      res.status(400).json({ error: "Ge?erli tarih/saat giriniz." });
      return;
    }
    if (when.getTime() <= Date.now()) {
      res.status(400).json({ error: "Ge?mi? bir tarih planlanamaz." });
      return;
    }

    const result = await service.schedule(userId, payload);
    if (!result.ok) {
      res.status(result.error.code).json({ error: result.error.message });
      return;
    }
    res.json({ data: result.value });
  },

  async history(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Yetkisiz" });
      return;
    }
    const result = await service.listHistory(userId);
    res.json({ data: result.ok ? result.value : [] });
  },

  async scheduled(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Yetkisiz" });
      return;
    }
    const result = await service.listScheduled(userId);
    res.json({ data: result.ok ? result.value : [] });
  },
});
