ALTER TYPE "public"."job_status" ADD VALUE IF NOT EXISTS 'pending_payment';--> statement-breakpoint
ALTER TYPE "public"."job_status" ADD VALUE IF NOT EXISTS 'pending_review';--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "contact_email" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "posted_by_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "amount_cents" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "currency" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "paid_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs" ADD CONSTRAINT "jobs_posted_by_profile_id_profiles_id_fk" FOREIGN KEY ("posted_by_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "jobs_stripe_checkout_session_uidx" ON "jobs" USING btree ("stripe_checkout_session_id");
