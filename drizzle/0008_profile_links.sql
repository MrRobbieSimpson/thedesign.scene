ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "links" jsonb DEFAULT '[]'::jsonb NOT NULL;
