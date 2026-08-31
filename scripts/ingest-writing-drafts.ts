/**
 * High-bar writing → drafts (same path as daily cron).
 *
 *   npm run ingest:writing-drafts
 *   npm run ingest:writing-drafts -- --dry-run
 */
import { config } from "dotenv";

import { pullWritingDrafts } from "../src/lib/ingest/pull-writing-drafts";

config({ path: ".env.local" });

async function main() {
  const dryRun =
    process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL — forcing dry run.\n");
  }

  const result = await pullWritingDrafts({ dryRun });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
