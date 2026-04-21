export type AccountKind = "instagram" | "facebook" | "social";

export type PostCreateTargetInput = {
  accountId: string;
  kind: AccountKind;
};

export type PublishNowInput = {
  title?: string;
  caption: string;
  hashtags?: string;
  mediaType?: "IMAGE" | "VIDEO" | null;
  mediaUrl?: string | null;
  media?: {
    name: string;
    mimeType: string;
    base64: string;
  } | null;
  medias?: Array<{
    name: string;
    mimeType: string;
    base64: string;
  }>;
  mediaUrls?: string[];
  targets: PostCreateTargetInput[];
};

export type ScheduleInput = PublishNowInput & {
  scheduledAt: string;
};

export type UpdateScheduledInput = {
  title?: string;
  caption: string;
  hashtags?: string;
  scheduledAt: string;
  targets: PostCreateTargetInput[];
};

export type PostTargetResult = {
  id: string;
  kind: AccountKind;
  platform: string;
  accountId: string;
  accountLabel: string | null;
  status: "SCHEDULED" | "SUCCESS" | "FAILED";
  errorMessage: string | null;
  externalPostId: string | null;
  publishedAt: string | null;
};

export type PostHistoryItem = {
  id: string;
  title: string | null;
  caption: string;
  hashtags: string | null;
  status: "SCHEDULED" | "PROCESSING" | "SUCCESS" | "FAILED" | "PARTIAL";
  createdAt: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  targets: PostTargetResult[];
};
