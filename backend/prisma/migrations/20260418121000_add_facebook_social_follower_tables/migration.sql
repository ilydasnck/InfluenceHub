-- Şema ile uyum: init migrasyonunda olmayan tablolar

CREATE TABLE IF NOT EXISTS "facebook_page_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "page_name" TEXT NOT NULL,
    "page_access_token" TEXT NOT NULL,
    "fan_count" INTEGER NOT NULL DEFAULT 0,
    "picture_url" TEXT,
    "page_link" TEXT,
    "last_profile_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facebook_page_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "facebook_page_accounts_user_id_page_id_key"
    ON "facebook_page_accounts"("user_id", "page_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'facebook_page_accounts_user_id_fkey'
    ) THEN
        ALTER TABLE "facebook_page_accounts"
            ADD CONSTRAINT "facebook_page_accounts_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "social_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "social_connections_user_id_platform_key"
    ON "social_connections"("user_id", "platform");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'social_connections_user_id_fkey'
    ) THEN
        ALTER TABLE "social_connections"
            ADD CONSTRAINT "social_connections_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "follower_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_kind" TEXT NOT NULL,
    "account_ref_id" TEXT NOT NULL,
    "follower_count" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follower_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "follower_snapshots_user_id_account_kind_account_ref_id_recorded_at_idx"
    ON "follower_snapshots"("user_id", "account_kind", "account_ref_id", "recorded_at");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'follower_snapshots_user_id_fkey'
    ) THEN
        ALTER TABLE "follower_snapshots"
            ADD CONSTRAINT "follower_snapshots_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
