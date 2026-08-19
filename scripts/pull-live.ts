/**
 * Pull REAL individual pieces: articles, design news, visuals, X posts.
 * No hub/homepage scrapes.
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
import {
  allDesignerXStatusUrls,
  classifyXWriting,
} from "../src/lib/ingest/designer-writers";
import { resolveImportUrl } from "../src/lib/ingest/resolve";
import { fetchRssCandidates } from "../src/lib/ingest/rss";
import { FEED_SOURCES } from "../src/lib/ingest/sources";

config({ path: ".env.local" });

/** Real article / story URLs (not homepages) */
const ARTICLE_URLS = [
  "https://www.handheld.design/p/calming-color-theory-design-picks",
  "https://www.handheld.design/p/colour-craft-and-catharsis-design",
  "https://www.smashingmagazine.com/2024/10/guide-designing-accessible-web-experiences/",
  "https://css-tricks.com/a-complete-guide-to-css-cascade-layers/",
  "https://bradfrost.com/blog/post/atomic-web-design/",
  "https://www.nngroup.com/articles/design-thinking/",
];

/** Designer / craft status URLs (X) — expanded via designer-writers.ts */
const X_STATUS_URLS = Array.from(
  new Set([
    ...allDesignerXStatusUrls(),
    "https://x.com/notevenclose99/status/2038861297089995081",
    "https://x.com/HephraUI/status/2038889715667996963",
    "https://x.com/nickbakeddesign/status/2038367912311062831",
    "https://x.com/marcelkargul/status/2089067498108813322",
    "https://x.com/figma/status/2088386933810663907",
    "https://x.com/rehanxahmed/status/2089566717311942661",
    "https://x.com/Anwuriii/status/1953354542692639111",
    "https://x.com/uiuxbyvicko/status/2087569993206534580",
    "https://x.com/brian_lovin/status/2080401424631140760",
    "https://x.com/joshpuckett/status/2065871351265837335",
  ])
);

const EVENT_URLS = [
  "https://config.figma.com/",
  "https://2026.uxlondon.com/",
  "https://leadingdesign.com/conferences/london-2026",
];

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

  console.log("=== Individual RSS articles / projects ===");
  for (const source of FEED_SOURCES) {
    // Writing sources get higher limits; news stays capped.
    const limit = source.writing
      ? 14
      : source.defaultType === "news"
        ? 4
        : source.defaultType === "visual"
          ? 8
          : 8;
    console.log(
      `\n${source.name} → ${source.defaultType} (limit ${limit}${source.writing ? ", writing" : ""})…`
    );
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

  console.log("\n=== Specific articles (OG) ===");
  for (const pageUrl of ARTICLE_URLS) {
    try {
      const resolved = await resolveImportUrl(pageUrl);
      if (isHubUrl(resolved.url)) {
        skipped += 1;
        continue;
      }
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
        continue;
      }
      const type =
        resolved.type === "visual" || resolved.type === "news"
          ? "article"
          : resolved.type;
      await db.insert(content).values({
        type,
        title: decodeTitle(resolved.title),
        excerpt: resolved.excerpt,
        image: resolved.image,
        url: resolved.url,
        sourceUrl: resolved.sourceUrl,
        sourcePlatform: resolved.sourcePlatform,
        externalId: resolved.externalId,
        authorName: resolved.authorName,
        status: "published",
        featured: false,
        publishedAt: new Date(),
      });
      created += 1;
      console.log(`  ✓ ${decodeTitle(resolved.title).slice(0, 70)}`);
    } catch (error) {
      errors.push(
        `${pageUrl}: ${error instanceof Error ? error.message : "failed"}`
      );
    }
  }

  console.log("\n=== Designer writing on X ===");
  for (const xUrl of X_STATUS_URLS) {
    try {
      const resolved = await resolveImportUrl(xUrl);
      if (!xUrl.includes("/status/")) continue;
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
        featured: false,
        publishedAt: new Date(),
        sourcePayload: resolved.sourcePayload,
      });
      created += 1;
      console.log(`  ✓ @${resolved.authorHandle} → ${type}`);
    } catch (error) {
      errors.push(
        `${xUrl}: ${error instanceof Error ? error.message : "failed"}`
      );
      console.log(`  ✗ ${xUrl}`);
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
        continue;
      }
      await db.insert(events).values({
        title: decodeTitle(resolved.title),
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
      });
      created += 1;
      console.log(`  ✓ ${resolved.title.slice(0, 60)}`);
    } catch (error) {
      errors.push(
        `${eventUrl}: ${error instanceof Error ? error.message : "failed"}`
      );
    }
  }

  const byType =
    await client`select type, count(*)::int as n from content where status='published' group by type order by n desc`;
  const sample =
    await client`select type, left(title,55) as title, source_platform from content where status='published' order by published_at desc nulls last limit 12`;
  const [{ n: contentCount }] =
    await client`select count(*)::int as n from content where status='published'`;
  const [{ n: eventCount }] =
    await client`select count(*)::int as n from events where status='published'`;

  console.log("\n=== Done ===");
  console.log({ created, skipped, errors: errors.length, contentCount, eventCount });
  console.table(byType);
  console.table(sample);
  if (errors.length) console.log(errors.slice(0, 10));

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
