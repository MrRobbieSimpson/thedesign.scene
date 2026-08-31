/**
 * High-bar visuals → published (image required).
 * Prefers Awwwards Sites of the Day; light Behance fill only.
 *
 *   npm run ingest:visuals
 *   npm run ingest:visuals -- --dry-run
 */
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { content } from "../src/db/schema";
import { fetchRssCandidates } from "../src/lib/ingest/rss";
import { getFeedSource } from "../src/lib/ingest/sources";

config({ path: ".env.local" });

const SOURCES: { id: string; limit: number }[] = [
  { id: "awwwards-sotd", limit: 24 },
  { id: "behance", limit: 12 },
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const url = process.env.DATABASE_URL;
  if (!url && !dryRun) {
    console.error("DATABASE_URL required (or pass --dry-run)");
    process.exit(1);
  }

  const client = url
    ? postgres(url, { prepare: false, max: 1 })
    : null;
  const db = client ? drizzle(client, { schema }) : null;

  let created = 0;
  let skipped = 0;
  let rejected = 0;

  for (const { id, limit } of SOURCES) {
    const source = getFeedSource(id);
    if (!source) {
      console.error(`Unknown source ${id}`);
      continue;
    }
    console.log(`\n${source.name} (limit ${limit})…`);
    let items;
    try {
      items = await fetchRssCandidates(source.feedUrl, limit);
    } catch (error) {
      console.error(
        `  ✗ ${error instanceof Error ? error.message : "fetch failed"}`
      );
      continue;
    }

    for (const item of items) {
      if (!item.image?.trim() || !item.url?.trim() || !item.title?.trim()) {
        rejected += 1;
        continue;
      }
      if (dryRun || !db) {
        console.log(`  · ${item.title.slice(0, 70)}`);
        created += 1;
        continue;
      }

      const existing = await db.query.content.findFirst({
        where: and(
          eq(content.sourcePlatform, source.platform),
          eq(content.externalId, item.externalId)
        ),
      });
      if (existing) {
        // Backfill image / promote to published visual if we already have a stub.
        if (
          existing.status !== "published" ||
          existing.type !== "visual" ||
          !existing.image
        ) {
          await db
            .update(content)
            .set({
              type: "visual",
              status: "published",
              image: existing.image || item.image,
              publishedAt: existing.publishedAt ?? item.publishedAt ?? new Date(),
              featured: false,
            })
            .where(eq(content.id, existing.id));
          created += 1;
          console.log(`  ↑ ${item.title.slice(0, 70)}`);
        } else {
          skipped += 1;
        }
        continue;
      }

      await db.insert(content).values({
        type: "visual",
        title: item.title,
        excerpt: item.excerpt,
        image: item.image,
        url: item.url,
        sourceUrl: item.url,
        sourcePlatform: source.platform,
        externalId: item.externalId,
        authorName: item.authorName?.trim() || null,
        status: "published",
        featured: false,
        publishedAt: item.publishedAt ?? new Date(),
      });
      created += 1;
      console.log(`  ✓ ${item.title.slice(0, 70)}`);
    }
  }

  console.log(
    `\nDone. created/updated=${created} skipped=${skipped} rejected=${rejected}`
  );
  if (client) await client.end({ timeout: 5 });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
