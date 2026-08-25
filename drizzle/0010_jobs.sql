DO $$ BEGIN
 CREATE TYPE "public"."job_status" AS ENUM('draft', 'published', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."job_work_mode" AS ENUM('remote', 'hybrid', 'onsite');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"description" text,
	"url" text,
	"location" text,
	"work_mode" "job_work_mode" DEFAULT 'remote' NOT NULL,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"editor_note" text,
	"role_kind" text,
	"company_url" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
