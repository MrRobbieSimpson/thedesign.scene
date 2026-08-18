import { config } from "dotenv";

import { resolveImportUrl } from "../src/lib/ingest/resolve";
import { insertResolvedDraft } from "../src/lib/ingest/upsert";

config({ path: ".env.local" });

async function main() {
  const url = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");

  if (!url || url.startsWith("--")) {
    console.error("Usage: npm run ingest:url -- <url> [--dry-run]");
    process.exit(1);
  }

  const resolved = await resolveImportUrl(url);
  console.log(JSON.stringify(resolved, null, 2));

  if (dryRun || !process.env.DATABASE_URL) {
    if (!process.env.DATABASE_URL) {
      console.log("\nNo DATABASE_URL — preview only.");
    }
    return;
  }

  const result = await insertResolvedDraft(resolved);
  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
