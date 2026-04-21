-- Posts modülü için veri modeli
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostStatus') THEN
    CREATE TYPE "PostStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'SUCCESS', 'FAILED', 'PARTIAL');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostTargetStatus') THEN
    CREATE TYPE "PostTargetStatus" AS ENUM ('SCHEDULED', 'SUCCESS', 'FAILED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "posts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "title" TEXT,
  "caption" TEXT NOT NULL,
  "hashtags" TEXT,
  "scheduled_at" TIMESTAMP(3),
  "published_at" TIMESTAMP(3),
  "status" "PostStatus" NOT NULL DEFAULT 'SCHEDULED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "post_targets" (
  "id" TEXT NOT NULL,
  "post_id" TEXT NOT NULL,
  "account_kind" TEXT NOT NULL,
  "account_ref_id" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "account_label" TEXT,
  "status" "PostTargetStatus" NOT NULL DEFAULT 'SCHEDULED',
  "error_message" TEXT,
  "external_post_id" TEXT,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "post_targets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "posts_user_id_status_created_at_idx"
  ON "posts"("user_id", "status", "created_at");

CREATE INDEX IF NOT EXISTS "post_targets_post_id_idx"
  ON "post_targets"("post_id");

CREATE INDEX IF NOT EXISTS "post_targets_account_kind_account_ref_id_idx"
  ON "post_targets"("account_kind", "account_ref_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_user_id_fkey'
  ) THEN
    ALTER TABLE "posts"
      ADD CONSTRAINT "posts_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'post_targets_post_id_fkey'
  ) THEN
    ALTER TABLE "post_targets"
      ADD CONSTRAINT "post_targets_post_id_fkey"
      FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
