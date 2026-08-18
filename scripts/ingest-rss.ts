import { config } from "dotenv";

import { fetchRssCandidates } from "../src/lib/ingest/rss";
import { FEED_SOURCES, getFeedSource } from "../src/lib/ingest/sources";
import { insertRssDrafts } from "../src/lib/ingest/upsert";

config({ path: ".env.local" });

function arg(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function main() {
  const sourceId = arg("--source") ?? "handheld";
  const limit = Number(arg("--limit") ?? "10");
  const dryRun = process.argv.includes("--dry-run");

  const source = getFeedSource(sourceId);
  if (!source) {
    console.error(
      `Unknown source "${sourceId}". Available: ${FEED_SOURCES.map((s) => s.id).join(", ")}`
    );
    process.exit(1);
  }

  console.log(`Fetching ${source.name} (limit ${limit})…`);
  const items = await fetchRssCandidates(source.feedUrl, limit);

  if (dryRun || !process.env.DATABASE_URL) {
    console.log(JSON.stringify(items, null, 2));
    if (!process.env.DATABASE_URL) {
      console.log("\nNo DATABASE_URL — printed preview only.");
    }
    return;
  }

  const result = await insertRssDrafts(source, items);
  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
