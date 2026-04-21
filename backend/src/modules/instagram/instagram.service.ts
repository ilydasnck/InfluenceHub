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
  if (params.mediaType === "CAROUSEL") {
    if (!params.mediaUrls || params.mediaUrls.length < 2) {
      return Result.fail({
        message: "Carousel icin en az iki mediaUrl gereklidir",
        type: "ValidationError",
        code: 400,
        isRateLimit: false,
      });
    }
    const invalid = params.mediaUrls.find((u) => !URL_PATTERN.test(u));
    if (invalid) {
      return Result.fail({
        message: "Carousel mediaUrl listesinde gecersiz URL var",
        type: "ValidationError",
        code: 400,
        isRateLimit: false,
      });
    }
  } else if (!params.mediaUrl || !URL_PATTERN.test(params.mediaUrl)) {
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

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const waitUntilContainerReady = async (
  repository: InstagramRepository,
  config: InstagramConfig,
  containerId: string,
): Promise<Result<true, InstagramApiError>> => {
  const maxAttempts = 8;
  const waitMs = 1500;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const status = await repository.fetchMediaStatus(config, containerId);
    if (!status.ok) {
      // Container status endpoint geçici olarak hata dönerse, akışı hemen kesme.
      await sleep(waitMs);
      continue;
    }

    const candidate = status.value as { status_code?: string };
    const code = candidate.status_code;
    if (code === "FINISHED") return Result.ok(true);
    if (code === "ERROR" || code === "EXPIRED") {
      return Result.fail({
        message: `Instagram medya hazirlama basarisiz: ${code}`,
        type: "ContainerNotReady",
        code: 400,
        isRateLimit: false,
      });
    }

    await sleep(waitMs);
  }

  return Result.fail({
    message: "Instagram medya hazirlama zaman asimina ugradi. Lutfen tekrar deneyin.",
    type: "ContainerNotReady",
    code: 400,
    isRateLimit: false,
  });
};

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

    let containerId = "";
    if (params.mediaType === "CAROUSEL" && params.mediaUrls && params.mediaUrls.length > 1) {
      const childIds: string[] = [];
      for (const mediaUrl of params.mediaUrls) {
        const isVideo = mediaUrl.toLowerCase().endsWith(".mp4") || mediaUrl.toLowerCase().endsWith(".mov");
        const childResult = await repository.createMediaContainer(config, {
          mediaType: isVideo ? "VIDEO" : "IMAGE",
          mediaUrl,
          isCarouselItem: true,
        });
        if (!childResult.ok) {
          logger.error("Carousel child container oluşturulamadı", "InstagramService", childResult.error);
          return Result.fail(handleRateLimitError(childResult.error));
        }
        const childReady = await waitUntilContainerReady(repository, config, childResult.value);
        if (!childReady.ok) return childReady;
        childIds.push(childResult.value);
      }
      const carouselResult = await repository.createMediaContainer(config, {
        mediaType: "CAROUSEL",
        mediaUrls: childIds,
        caption: params.caption,
      });
      if (!carouselResult.ok) {
        logger.error("Carousel container oluşturulamadı", "InstagramService", carouselResult.error);
        return Result.fail(handleRateLimitError(carouselResult.error));
      }
      containerId = carouselResult.value;
    } else {
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
      containerId = containerResult.value;
    }
    logger.info(`Container oluşturuldu: ${containerId}`, "InstagramService");

    const readyResult = await waitUntilContainerReady(repository, config, containerId);
    if (!readyResult.ok) {
      logger.error(
        "Container hazir degil",
        "InstagramService",
        readyResult.error,
      );
      return readyResult;
    }

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
