export type MediaType = "IMAGE" | "VIDEO" | "REELS" | "CAROUSEL";

export interface InstagramConfig {
  readonly accessToken: string;
  readonly businessAccountId: string;
}

export interface PublishMediaParams {
  readonly mediaType: MediaType;
  readonly mediaUrl: string;
  readonly caption?: string;
}

export interface MediaContainerResponse {
  readonly id: string;
}

export interface PublishResult {
  readonly id: string;
}

export type StatusCode = "FINISHED" | "IN_PROGRESS" | "ERROR" | "EXPIRED";

export interface ContainerStatus {
  readonly id: string;
  readonly status_code: StatusCode;
}

export interface MediaInfo {
  readonly id: string;
  readonly timestamp?: string;
  readonly permalink?: string;
  readonly media_type?: string;
  readonly media_url?: string;
  readonly caption?: string;
}

export type MediaStatus = ContainerStatus | MediaInfo;

export interface InstagramApiError {
  readonly message: string;
  readonly type: string;
  readonly code: number;
  readonly fbtrace_id?: string;
  readonly isRateLimit: boolean;
}

export interface InstagramGraphApiErrorResponse {
  readonly error: {
    readonly message: string;
    readonly type: string;
    readonly code: number;
    readonly fbtrace_id?: string;
  };
}
