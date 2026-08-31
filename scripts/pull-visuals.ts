/**
 * High-bar product / UI visuals → published (image required).
 *
 * Sources (quality over volume):
 *   - Spotted in Prod clips (real product UI)
 *   - recent.design interface / product shots
 *   - Httpster featured websites
 *   - One Page Love (RSS)
 *   - SaaS Landing Page (RSS)
 *
 * Also demotes generic Behance + Awwwards out of the live Visuals tab.
 *
 *   npm run ingest:visuals
 *   npm run ingest:visuals -- --dry-run
 */
import { config } from "dotenv";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { content } from "../src/db/schema";
import { resolveImportUrl } from "../src/lib/ingest/resolve";
import { fetchRssCandidates } from "../src/lib/ingest/rss";

config({ path: ".env.local" });

const UA =
  "sitwithdesign/1.0 (+https://sitwithdesign.online; curated design platform)";

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "follow",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${url} → ${response.status}`);
  return response.text();
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}

/** Spotted in Prod — maker clip pages with unique OG images. */
async function discoverSpottedClipUrls(limit = 24): Promise<string[]> {
  const home = await fetchHtml("https://www.spottedinprod.com/");
  const paths = new Set(
    Array.from(
      home.matchAll(/href="(\/[A-Za-z0-9_-]+\/clips\/\d+)"/g),
      (m) => m[1]
    )
  );

  for (const path of Array.from(paths).slice(0, 8)) {
    try {
      const html = await fetchHtml(`https://www.spottedinprod.com${path}`);
      for (const m of html.matchAll(/href="(\/[A-Za-z0-9_-]+\/clips\/\d+)"/g)) {
        paths.add(m[1]);
      }
    } catch {
      // ignore
    }
  }

  return Array.from(paths)
    .slice(0, limit)
    .map((path) => `https://www.spottedinprod.com${path}`);
}

/** recent.design interface / product shots. */
async function discoverRecentDesignUrls(limit = 28): Promise<string[]> {
  const html = await fetchHtml("https://recent.design/");
  const paths = unique(
    Array.from(html.matchAll(/href="(\/i\/[a-z0-9-]+)"/g), (m) => m[1])
  );
  return paths.slice(0, limit).map((path) => `https://recent.design${path}`);
}

/** Httpster — curated website craft. */
async function discoverHttpsterUrls(limit = 24): Promise<string[]> {
  const html = await fetchHtml("https://httpster.net/");
  const paths = unique(
    Array.from(
      html.matchAll(/href=["'](\/website\/[a-z0-9-]+\/?)["']/gi),
      (m) => m[1].replace(/\/$/, "")
    )
  );
  return paths.slice(0, limit).map((path) => `https://httpster.net${path}`);
}

/** RSS feeds that land on individual product/UI inspiration pages. */
async function discoverRssVisualUrls(
  feedUrl: string,
  limit: number
): Promise<string[]> {
  const items = await fetchRssCandidates(feedUrl, limit);
  return unique(
    items
      .map((item) => item.url.trim())
      .filter((url) => /^https?:\/\//i.test(url))
  );
}

type Db = ReturnType<typeof drizzle<typeof schema>>;

async function upsertVisualFromUrl(
  db: Db,
  pageUrl: string
): Promise<"created" | "updated" | "skipped" | "rejected"> {
  let resolved;
  try {
    resolved = await resolveImportUrl(pageUrl);
  } catch {
    return "rejected";
  }

  if (!resolved.image?.trim() || !resolved.title?.trim()) return "rejected";
  // Skip generic site-wide OG fallbacks.
  if (
    /\/og\.png/i.test(resolved.image) ||
    /opengraph-image\.png/i.test(resolved.image) ||
    /one-page-love-meta/i.test(resolved.image) ||
    /Link-Share-Img/i.test(resolved.image)
  ) {
    return "rejected";
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
    if (
      existing.status === "published" &&
      existing.type === "visual" &&
      existing.image
    ) {
      return "skipped";
    }
    await db
      .update(content)
      .set({
        type: "visual",
        status: "published",
        title: resolved.title,
        excerpt: resolved.excerpt,
        image: resolved.image,
        authorName: resolved.authorName,
        authorHandle: resolved.authorHandle,
        publishedAt: existing.publishedAt ?? new Date(),
        featured: false,
      })
      .where(eq(content.id, existing.id));
    return "updated";
  }

  await db.insert(content).values({
    type: "visual",
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
    featured: false,
    publishedAt: new Date(),
  });
  return "created";
}

async function demoteGenericVisuals(db: Db) {
  const result = await db
    .update(content)
    .set({ status: "draft", featured: false })
    .where(
      and(
        eq(content.type, "visual"),
        eq(content.status, "published"),
        inArray(content.sourcePlatform, ["behance", "awwwards"])
      )
    )
    .returning({ id: content.id });
  return result.length;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const url = process.env.DATABASE_URL;
  if (!url && !dryRun) {
    console.error("DATABASE_URL required (or pass --dry-run)");
    process.exit(1);
  }

  const client = url ? postgres(url, { prepare: false, max: 1 }) : null;
  const db: Db | null = client ? drizzle(client, { schema }) : null;

  const buckets: { name: string; urls: string[] }[] = [];

  console.log("Discovering Spotted in Prod clips…");
  buckets.push({ name: "spotted", urls: await discoverSpottedClipUrls(24) });

  console.log("Discovering recent.design shots…");
  buckets.push({ name: "recent", urls: await discoverRecentDesignUrls(28) });

  console.log("Discovering Httpster websites…");
  try {
    buckets.push({ name: "httpster", urls: await discoverHttpsterUrls(24) });
  } catch (error) {
    console.log(
      `  ✗ ${error instanceof Error ? error.message : "httpster failed"}`
    );
  }

  console.log("Discovering One Page Love (RSS)…");
  try {
    buckets.push({
      name: "onepagelove",
      urls: await discoverRssVisualUrls("https://onepagelove.com/feed", 18),
    });
  } catch (error) {
    console.log(
      `  ✗ ${error instanceof Error ? error.message : "onepagelove failed"}`
    );
  }

  console.log("Discovering SaaS Landing Page (RSS)…");
  try {
    buckets.push({
      name: "saaslandingpage",
      urls: await discoverRssVisualUrls(
        "https://saaslandingpage.com/feed/",
        18
      ),
    });
  } catch (error) {
    console.log(
      `  ✗ ${error instanceof Error ? error.message : "saaslandingpage failed"}`
    );
  }

  for (const bucket of buckets) {
    console.log(`  ${bucket.name}: ${bucket.urls.length}`);
  }

  const urls = unique(buckets.flatMap((bucket) => bucket.urls));
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let rejected = 0;

  for (const pageUrl of urls) {
    if (dryRun || !db) {
      console.log(`  · ${pageUrl}`);
      created += 1;
      continue;
    }
    const result = await upsertVisualFromUrl(db, pageUrl);
    if (result === "created") {
      created += 1;
      console.log(`  ✓ ${pageUrl}`);
    } else if (result === "updated") {
      updated += 1;
      console.log(`  ↑ ${pageUrl}`);
    } else if (result === "skipped") {
      skipped += 1;
    } else {
      rejected += 1;
    }
  }

  let demoted = 0;
  if (db && !dryRun) {
    demoted = await demoteGenericVisuals(db);
    console.log(
      `\nDemoted generic Behance/Awwwards visuals → draft: ${demoted}`
    );
  }

  console.log(
    `\nDone. created=${created} updated=${updated} skipped=${skipped} rejected=${rejected} demoted=${demoted}`
  );
  if (client) await client.end({ timeout: 5 });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
