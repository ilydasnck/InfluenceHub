import { Result } from "../../shared/result";
import { HttpClient, HttpError } from "../../shared/httpClient";
import {
  InstagramConfig,
  PublishMediaParams,
  MediaContainerResponse,
  PublishResult,
  MediaStatus,
  MediaInfo,
  ContainerStatus,
  InstagramApiError,
  InstagramGraphApiErrorResponse,
} from "./instagram.types";

const RATE_LIMIT_CODES = [4, 32, 613] as const;

const toInstagramApiError = (httpError: HttpError): InstagramApiError => {
  const graphError = (httpError.data as InstagramGraphApiErrorResponse | undefined)?.error;

  if (graphError) {
    return {
      message: graphError.message,
      type: graphError.type,
      code: graphError.code,
      fbtrace_id: graphError.fbtrace_id,
      isRateLimit: RATE_LIMIT_CODES.includes(graphError.code as typeof RATE_LIMIT_CODES[number]),
    };
  }

  return {
    message: httpError.message,
    type: "UnknownError",
    code: httpError.status,
    isRateLimit: false,
  };
};

const mapError = <T>(result: Result<T, HttpError>): Result<T, InstagramApiError> =>
  result.ok ? result : Result.fail(toInstagramApiError(result.error));

const buildMediaParams = (params: PublishMediaParams): Record<string, string> => {
  const base: Record<string, string> = {
    media_type: params.mediaType,
  };

  if (params.caption) {
    base.caption = params.caption;
  }

  if (params.mediaType === "VIDEO" || params.mediaType === "REELS") {
    base.video_url = params.mediaUrl;
  } else {
    base.image_url = params.mediaUrl;
  }

  return base;
};

export const createInstagramRepository = (client: HttpClient) => ({
  async createMediaContainer(
    config: InstagramConfig,
    params: PublishMediaParams,
  ): Promise<Result<string, InstagramApiError>> {
    const result = await client.post<MediaContainerResponse>(
      `/${config.businessAccountId}/media`,
      null,
      {
        params: {
          access_token: config.accessToken,
          ...buildMediaParams(params),
        },
      },
    );

    return Result.map(mapError(result), (data) => data.id);
  },

  async publishMediaContainer(
    config: InstagramConfig,
    containerId: string,
  ): Promise<Result<string, InstagramApiError>> {
    const result = await client.post<PublishResult>(
      `/${config.businessAccountId}/media_publish`,
      null,
      {
        params: {
          access_token: config.accessToken,
          creation_id: containerId,
        },
      },
    );

    return Result.map(mapError(result), (data) => data.id);
  },

  async fetchMediaStatus(
    config: InstagramConfig,
    mediaId: string,
  ): Promise<Result<MediaStatus, InstagramApiError>> {
    const mediaResult = await client.get<MediaInfo>(
      `/${mediaId}`,
      {
        params: {
          access_token: config.accessToken,
          fields: "id,timestamp,permalink,media_type,media_url,caption",
        },
      },
    );

    if (mediaResult.ok) return mapError(mediaResult);

    const containerResult = await client.get<ContainerStatus>(
      `/${mediaId}`,
      {
        params: {
          access_token: config.accessToken,
          fields: "id,status_code",
        },
      },
    );

    return mapError(containerResult);
  },
});

export type InstagramRepository = ReturnType<typeof createInstagramRepository>;
