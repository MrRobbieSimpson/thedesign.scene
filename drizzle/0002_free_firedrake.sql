ALTER TABLE "events" ADD COLUMN "source_platform" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "source_payload" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "events_source_external_uidx" ON "events" USING btree ("source_platform","external_id") WHERE "events"."source_platform" is not null and "events"."external_id" is not null;