/**
 * Pull curated design content + events from the web into Neon as published.
 *
 *   npx tsx scripts/pull-live.ts
 */
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { content, events } from "../src/db/schema";
import {
  eventNeedsDates,
  resolveEventUrl,
} from "../src/lib/ingest/event-resolve";
import { resolveImportUrl } from "../src/lib/ingest/resolve";
import { fetchRssCandidates } from "../src/lib/ingest/rss";
import { FEED_SOURCES } from "../src/lib/ingest/sources";

config({ path: ".env.local" });

const EXTRA_URLS = [
  "https://www.spottedinprod.com/",
  "https://www.siteinspire.com/",
  "https://www.awwwards.com/websites/",
  "https://www.itsnicethat.com/",
  "https://www.fastcompany.com/co-design",
  "https://recent.design/",
];

const EVENT_URLS = [
  "https://config.figma.com/",
  "https://2026.uxlondon.com/",
  "https://leadingdesign.com/conferences/london-2026",
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  console.log("=== RSS feeds ===");
  for (const source of FEED_SOURCES) {
    const limit =
      source.id === "dezeen" || source.id === "smashing" ? 10 : 6;
    console.log(`\n${source.name} (limit ${limit})…`);
    try {
      const items = await fetchRssCandidates(source.feedUrl, limit);
      for (const item of items) {
        const existing = await db.query.content.findFirst({
          where: and(
            eq(content.sourcePlatform, source.platform),
            eq(content.externalId, item.externalId)
          ),
        });
        if (existing) {
          skipped += 1;
          continue;
        }
        await db.insert(content).values({
          type: source.defaultType,
          title: item.title,
          excerpt: item.excerpt,
          image: item.image,
          url: item.url,
          sourceUrl: item.url,
          sourcePlatform: source.platform,
          externalId: item.externalId,
          authorName: item.authorName ?? source.name,
          status: "published",
          featured: false,
          publishedAt: item.publishedAt ?? new Date(),
        });
        created += 1;
      }
      console.log(`  +${items.length} candidates processed`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "feed failed";
      errors.push(`${source.id}: ${msg}`);
      console.log(`  ✗ ${msg}`);
    }
  }

  console.log("\n=== Extra URLs (Open Graph) ===");
  for (const pageUrl of EXTRA_URLS) {
    try {
      const resolved = await resolveImportUrl(pageUrl);
      const existing = resolved.externalId
        ? await db.query.content.findFirst({
            where: and(
              eq(content.sourcePlatform, resolved.sourcePlatform),
              eq(content.externalId, resolved.externalId)
            ),
          })
        : null;
      if (existing) {
        skipped += 1;
        console.log(`  · skip ${resolved.title.slice(0, 50)}`);
        continue;
      }
      await db.insert(content).values({
        type: resolved.type,
        title: resolved.title,
        excerpt: resolved.excerpt,
        image: resolved.image,
        url: resolved.url,
        sourceUrl: resolved.sourceUrl,
        sourcePlatform: resolved.sourcePlatform,
        externalId: resolved.externalId,
        authorHandle: resolved.authorHandle,
        authorName: resolved.authorName,
        status: "published",
        featured: true,
        publishedAt: new Date(),
        sourcePayload: resolved.sourcePayload,
      });
      created += 1;
      console.log(`  ✓ ${resolved.title.slice(0, 60)}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "failed";
      errors.push(`${pageUrl}: ${msg}`);
      console.log(`  ✗ ${pageUrl} — ${msg}`);
    }
  }

  console.log("\n=== Events ===");
  for (const eventUrl of EVENT_URLS) {
    try {
      const resolved = await resolveEventUrl(eventUrl);
      if (eventNeedsDates(resolved)) {
        resolved.startDate = new Date("2026-09-15T12:00:00.000Z");
      }
      const existing = await db.query.events.findFirst({
        where: and(
          eq(events.sourcePlatform, resolved.sourcePlatform),
          eq(events.externalId, resolved.externalId)
        ),
      });
      if (existing) {
        skipped += 1;
        console.log(`  · skip ${resolved.title.slice(0, 50)}`);
        continue;
      }
      await db.insert(events).values({
        title: resolved.title,
        description: resolved.description,
        url: resolved.url,
        location: resolved.location,
        startDate: resolved.startDate,
        endDate: resolved.endDate,
        type: resolved.type,
        status: "published",
        sourcePlatform: resolved.sourcePlatform,
        sourceUrl: resolved.sourceUrl,
        externalId: resolved.externalId,
        sourcePayload: resolved.sourcePayload,
      });
      created += 1;
      console.log(`  ✓ ${resolved.title.slice(0, 60)}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "failed";
      errors.push(`${eventUrl}: ${msg}`);
      console.log(`  ✗ ${eventUrl} — ${msg}`);
    }
  }

  const [{ n: contentCount }] =
    await client`select count(*)::int as n from content where status = 'published'`;
  const [{ n: eventCount }] =
    await client`select count(*)::int as n from events where status = 'published'`;

  console.log("\n=== Done ===");
  console.log({ created, skipped, errorCount: errors.length, contentCount, eventCount });
  if (errors.length) console.log(errors.slice(0, 12));

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
