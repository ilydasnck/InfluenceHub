import { Result } from "../../shared/result";
import { logger } from "../../shared/logger";
import {
  InstagramConfig,
  PublishMediaParams,
  MediaStatus,
  InstagramApiError,
} from "./instagram.types";
import { InstagramRepository } from "./instagram.repository";

const VALID_MEDIA_TYPES = ["IMAGE", "VIDEO", "REELS", "CAROUSEL"] as const;
const URL_PATTERN = /^https?:\/\/.+/;

interface PublishMediaResult {
  readonly mediaId: string;
  readonly containerId: string;
}

const validatePublishParams = (
  params: PublishMediaParams,
): Result<PublishMediaParams, InstagramApiError> => {
  if (!params.mediaUrl || !URL_PATTERN.test(params.mediaUrl)) {
    return Result.fail({
      message: "Geçerli bir mediaUrl (http/https) gereklidir",
      type: "ValidationError",
      code: 400,
      isRateLimit: false,
    });
  }

  if (!params.mediaType || !VALID_MEDIA_TYPES.includes(params.mediaType)) {
    return Result.fail({
      message: `mediaType şu değerlerden biri olmalıdır: ${VALID_MEDIA_TYPES.join(", ")}`,
      type: "ValidationError",
      code: 400,
      isRateLimit: false,
    });
  }

  return Result.ok(params);
};

const handleRateLimitError = (error: InstagramApiError): InstagramApiError =>
  error.isRateLimit
    ? {
        ...error,
        message:
          "Instagram API rate limit aşıldı. Lütfen daha sonra tekrar deneyin.",
      }
    : error;

export const createInstagramService = (repository: InstagramRepository) => ({
  async publishMedia(
    config: InstagramConfig,
    params: PublishMediaParams,
  ): Promise<Result<PublishMediaResult, InstagramApiError>> {
    const validation = validatePublishParams(params);
    if (!validation.ok) return validation;

    logger.info(
      `Medya paylaşımı başlatılıyor: ${params.mediaType}`,
      "InstagramService",
    );

    const containerResult = await repository.createMediaContainer(
      config,
      params,
    );
    if (!containerResult.ok) {
      logger.error(
        "Container oluşturulamadı",
        "InstagramService",
        containerResult.error,
      );
      return Result.fail(handleRateLimitError(containerResult.error));
    }

    const containerId = containerResult.value;
    logger.info(`Container oluşturuldu: ${containerId}`, "InstagramService");

    const publishResult = await repository.publishMediaContainer(
      config,
      containerId,
    );
    if (!publishResult.ok) {
      logger.error(
        "Medya yayınlanamadı",
        "InstagramService",
        publishResult.error,
      );
      return Result.fail(handleRateLimitError(publishResult.error));
    }

    logger.info(`Medya yayınlandı: ${publishResult.value}`, "InstagramService");
    return Result.ok({ mediaId: publishResult.value, containerId });
  },

  async getMediaStatus(
    config: InstagramConfig,
    mediaId: string,
  ): Promise<Result<MediaStatus, InstagramApiError>> {
    if (!mediaId || mediaId.trim().length === 0) {
      return Result.fail({
        message: "mediaId gereklidir",
        type: "ValidationError",
        code: 400,
        isRateLimit: false,
      });
    }

    const result = await repository.fetchMediaStatus(config, mediaId);
    if (!result.ok) {
      logger.error("Medya durumu alınamadı", "InstagramService", result.error);
      return Result.fail(handleRateLimitError(result.error));
    }

    return result;
  },
});

export type InstagramService = ReturnType<typeof createInstagramService>;
