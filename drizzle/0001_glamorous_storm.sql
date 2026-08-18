ALTER TYPE "public"."content_type" ADD VALUE 'news';--> statement-breakpoint
ALTER TYPE "public"."content_type" ADD VALUE 'post';--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "source_platform" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "author_handle" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "author_name" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "source_payload" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "content_source_external_uidx" ON "content" USING btree ("source_platform","external_id") WHERE "content"."source_platform" is not null and "content"."external_id" is not null;