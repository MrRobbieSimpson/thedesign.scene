DO $$ BEGIN
 CREATE TYPE "public"."community_badge" AS ENUM('none', 'founder', 'founding_writer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "community_badge" "community_badge" DEFAULT 'none' NOT NULL;
