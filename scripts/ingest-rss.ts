/**
 *   npm run ingest:rss -- --source handheld --limit 3
 *   npm run ingest:rss -- --source smashing --limit 5 --dry-run
 */
import { config } from "dotenv";

config({ path: ".env.local" });

function arg(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function main() {
  const { fetchRssCandidates } = await import("../src/lib/ingest/rss");
  const { FEED_SOURCES, getFeedSource } = await import(
    "../src/lib/ingest/sources"
  );
  const { insertRssDrafts } = await import("../src/lib/ingest/upsert");

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
  console.log(JSON.stringify(items, null, 2));

  if (dryRun || !process.env.DATABASE_URL) {
    if (!process.env.DATABASE_URL) {
      console.log("\nNo DATABASE_URL — preview only.");
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
