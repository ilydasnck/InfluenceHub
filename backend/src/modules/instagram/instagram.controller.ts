import { Request, Response } from "express";
import { PublishMediaParams } from "./instagram.types";
import { InstagramService } from "./instagram.service";
import { AuthService } from "../auth/auth.service";
import { logger } from "../../shared/logger";

const errorStatusCode = (code: number): number => {
  if (code === 400) return 400;
  if (code === 429 || code === 4 || code === 32 || code === 613) return 429;
  return 502;
};

export const createInstagramController = (
  service: InstagramService,
  authService: AuthService,
) => ({
  async handlePublishMedia(req: Request, res: Response): Promise<void> {
    const userId = Array.isArray(req.headers["x-user-id"])
      ? req.headers["x-user-id"][0]
      : req.headers["x-user-id"];

    if (!userId) {
      res.status(401).json({ error: "x-user-id header gereklidir" });
      return;
    }

    const configResult = await authService.getInstagramConfigByUserId(userId);
    if (!configResult.ok) {
      res.status(configResult.error.code).json({ error: configResult.error.message });
      return;
    }

    const { mediaType, mediaUrl, caption } = req.body as Partial<PublishMediaParams>;

    if (!mediaType || !mediaUrl) {
      res.status(400).json({ error: "mediaType ve mediaUrl alanları zorunludur" });
      return;
    }

    const params: PublishMediaParams = { mediaType, mediaUrl, caption };
    const result = await service.publishMedia(configResult.value, params);

    if (!result.ok) {
      const status = result.error.isRateLimit ? 429 : errorStatusCode(result.error.code);
      logger.warn(`Publish başarısız: ${result.error.message}`, "InstagramController");
      res.status(status).json({ error: result.error });
      return;
    }

    res.status(201).json({ data: result.value });
  },

  async handleGetMediaStatus(req: Request, res: Response): Promise<void> {
    const userId = Array.isArray(req.headers["x-user-id"])
      ? req.headers["x-user-id"][0]
      : req.headers["x-user-id"];

    if (!userId) {
      res.status(401).json({ error: "x-user-id header gereklidir" });
      return;
    }

    const configResult = await authService.getInstagramConfigByUserId(userId);
    if (!configResult.ok) {
      res.status(configResult.error.code).json({ error: configResult.error.message });
      return;
    }

    const mediaId = Array.isArray(req.params.mediaId)
      ? req.params.mediaId[0]
      : req.params.mediaId;
    const result = await service.getMediaStatus(configResult.value, mediaId);

    if (!result.ok) {
      const status = result.error.isRateLimit ? 429 : errorStatusCode(result.error.code);
      logger.warn(`Status sorgusu başarısız: ${result.error.message}`, "InstagramController");
      res.status(status).json({ error: result.error });
      return;
    }

    res.status(200).json({ data: result.value });
  },
});

export type InstagramController = ReturnType<typeof createInstagramController>;
