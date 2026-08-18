CREATE TYPE "public"."content_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('thought', 'visual', 'build');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('in-person', 'hybrid', 'remote');--> statement-breakpoint
CREATE TABLE "content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "content_type" NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"excerpt" text,
	"image" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"maker_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text,
	"location" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"type" "event_type" NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "makers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"handle" text NOT NULL,
	"bio" text,
	"avatar" text,
	"website" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "makers_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_maker_id_makers_id_fk" FOREIGN KEY ("maker_id") REFERENCES "public"."makers"("id") ON DELETE set null ON UPDATE no action;