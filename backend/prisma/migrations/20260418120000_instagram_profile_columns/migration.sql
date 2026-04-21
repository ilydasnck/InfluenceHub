-- Prisma şeması ile uyum: instagram_accounts eksik sütunları
ALTER TABLE "instagram_accounts" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "instagram_accounts" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "instagram_accounts" ADD COLUMN IF NOT EXISTS "profile_picture_url" TEXT;
ALTER TABLE "instagram_accounts" ADD COLUMN IF NOT EXISTS "followers_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "instagram_accounts" ADD COLUMN IF NOT EXISTS "last_profile_synced_at" TIMESTAMP(3);
