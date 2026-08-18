/**
 * Pull designer writing — RSS essays + craft posts from X.
 *
 *   npx tsx scripts/pull-writers.ts
 */
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { content } from "../src/db/schema";
import {
  allDesignerXStatusUrls,
  classifyXWriting,
  WRITER_FEEDS,
} from "../src/lib/ingest/designer-writers";
import { resolveImportUrl } from "../src/lib/ingest/resolve";
import { fetchRssCandidates } from "../src/lib/ingest/rss";
import { getWritingSources } from "../src/lib/ingest/sources";

config({ path: ".env.local" });

function decodeTitle(title: string) {
  return title
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

function isHubUrl(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "") || "/";
    return path === "/";
  } catch {
    return false;
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  console.log("=== Designer writing feeds ===");
  const writingSources = getWritingSources();
  for (const source of writingSources) {
    const limit = 12;
    console.log(`\n${source.name} → ${source.defaultType} (limit ${limit})…`);
    try {
      const items = await fetchRssCandidates(source.feedUrl, limit);
      for (const item of items) {
        if (isHubUrl(item.url)) {
          skipped += 1;
          continue;
        }
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
          title: decodeTitle(item.title),
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
      console.log(`  ok (${items.length} fetched)`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "feed failed";
      errors.push(`${source.id}: ${msg}`);
      console.log(`  ✗ ${msg}`);
    }
  }

  // Extra writer feeds not yet folded into FEED_SOURCES platform map
  console.log("\n=== Extra writer feeds ===");
  for (const feed of WRITER_FEEDS) {
    if (writingSources.some((source) => source.id === feed.id)) continue;
    console.log(`\n${feed.name}…`);
    try {
      const items = await fetchRssCandidates(feed.feedUrl, 8);
      for (const item of items) {
        if (isHubUrl(item.url)) {
          skipped += 1;
          continue;
        }
        const existing = await db.query.content.findFirst({
          where: and(
            eq(content.sourcePlatform, "web"),
            eq(content.externalId, item.externalId)
          ),
        });
        if (existing) {
          skipped += 1;
          continue;
        }
        await db.insert(content).values({
          type: feed.defaultType,
          title: decodeTitle(item.title),
          excerpt: item.excerpt,
          image: item.image,
          url: item.url,
          sourceUrl: item.url,
          sourcePlatform: "web",
          externalId: item.externalId,
          authorName: item.authorName ?? feed.name,
          status: "published",
          featured: false,
          publishedAt: item.publishedAt ?? new Date(),
        });
        created += 1;
      }
      console.log(`  ok (${items.length} fetched)`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "feed failed";
      errors.push(`${feed.id}: ${msg}`);
      console.log(`  ✗ ${msg}`);
    }
  }

  console.log("\n=== Designer writing on X ===");
  for (const xUrl of allDesignerXStatusUrls()) {
    try {
      const resolved = await resolveImportUrl(xUrl);
      const existing = resolved.externalId
        ? await db.query.content.findFirst({
            where: and(
              eq(content.sourcePlatform, "x"),
              eq(content.externalId, resolved.externalId)
            ),
          })
        : null;
      if (existing) {
        skipped += 1;
        continue;
      }
      const type = classifyXWriting(resolved.excerpt);
      await db.insert(content).values({
        type,
        title: decodeTitle(resolved.title),
        excerpt: resolved.excerpt,
        image: resolved.image,
        url: resolved.url,
        sourceUrl: resolved.sourceUrl,
        sourcePlatform: "x",
        externalId: resolved.externalId,
        authorHandle: resolved.authorHandle,
        authorName: resolved.authorName,
        status: "published",
        featured: type === "thought",
        publishedAt: new Date(),
        sourcePayload: resolved.sourcePayload,
      });
      created += 1;
      console.log(`  ✓ @${resolved.authorHandle} → ${type}`);
    } catch (error) {
      errors.push(
        `${xUrl}: ${error instanceof Error ? error.message : "failed"}`
      );
      console.log(`  ✗ ${xUrl.slice(0, 60)}`);
    }
  }

  const byType =
    await client`select type, count(*)::int as n from content where status='published' group by type order by n desc`;
  const writers =
    await client`select type, left(title,50) as title, coalesce(author_handle, author_name, source_platform) as who from content where status='published' and type in ('article','thought') order by published_at desc nulls last limit 15`;

  console.log("\n=== Done ===");
  console.log({ created, skipped, errors: errors.length });
  console.table(byType);
  console.table(writers);
  if (errors.length) console.log(errors.slice(0, 12));

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
