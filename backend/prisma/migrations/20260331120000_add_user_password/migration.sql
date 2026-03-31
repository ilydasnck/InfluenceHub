-- Zorunlu password alanı (test / OAuth öncesi kullanıcılar için varsayılan değer)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT;

UPDATE "users" SET "password" = '__INFLUENCEHUB_LEGACY_PLACEHOLDER__' WHERE "password" IS NULL;

ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL;
