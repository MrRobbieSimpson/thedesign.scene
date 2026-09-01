ALTER TYPE "public"."event_status" ADD VALUE IF NOT EXISTS 'pending_payment';--> statement-breakpoint
ALTER TYPE "public"."event_status" ADD VALUE IF NOT EXISTS 'pending_review';--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."feature_boost_status" AS ENUM('none', 'pending_payment', 'pending_review');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "contact_email" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "posted_by_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "amount_cents" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "currency" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "paid_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_posted_by_profile_id_profiles_id_fk" FOREIGN KEY ("posted_by_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "events_stripe_checkout_session_uidx" ON "events" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN IF NOT EXISTS "feature_boost_status" "feature_boost_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN IF NOT EXISTS "feature_stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN IF NOT EXISTS "feature_stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN IF NOT EXISTS "feature_amount_cents" integer;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN IF NOT EXISTS "feature_paid_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "content_feature_stripe_checkout_uidx" ON "content" USING btree ("feature_stripe_checkout_session_id");
