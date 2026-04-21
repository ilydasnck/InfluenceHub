export type CreateAccountOption = {
  id: string;
  kind: "instagram" | "facebook" | "social";
  platform: string;
  label: string;
  handle: string;
};

export type CreateMediaItem = {
  file: File;
  kind: "image" | "video";
};

export type CreatePostHistoryItem = {
  id: string;
  title: string | null;
  caption: string;
  hashtags: string | null;
  status: "SCHEDULED" | "PROCESSING" | "SUCCESS" | "FAILED" | "PARTIAL";
  createdAt: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  targets: Array<{
    id: string;
    kind: "instagram" | "facebook" | "social";
    platform: string;
    accountId: string;
    accountLabel: string | null;
    status: "SCHEDULED" | "SUCCESS" | "FAILED";
    errorMessage: string | null;
  }>;
};
