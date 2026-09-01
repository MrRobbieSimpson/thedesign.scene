/**
 * High-bar product / UI visuals → published (image required).
 *
 * Sources:
 *   - Layers.to posts that include still-image layers (thumbnails)
 *   - recent.design items whose slug reads as product/UI
 *
 * Spotted in Prod is excluded — OG full-frames, not thumbnails.
 * Also demotes Behance / Awwwards / Httpster / One Page Love / SaaS LP / Spotted.
 *
 *   npm run ingest:visuals
 *   npm run ingest:visuals -- --dry-run
 */
import { config } from "dotenv";
import { and, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { content } from "../src/db/schema";
import { resolveImportUrl } from "../src/lib/ingest/resolve";
import { normalizeImageUrl } from "../src/lib/images";

config({ path: ".env.local" });

const UA =
  "sitwithdesign/1.0 (+https://sitwithdesign.online; curated design platform)";

const PRODUCT_UI_SLUG =
  /app|ui|ux|interface|onboard|dashboard|saas|mobile|product|screen|flow|pay|wallet|bank|finance|health|music|map|chat|inbox|settings|home-screen|icon|portfolio-theme|monitor|feature/i;

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

function isStillImage(url: string) {
  return !/\.(mp4|webm|mov)(\?|$)/i.test(url);
}

/** recent.design — only product/UI-leaning slugs. */
async function discoverRecentDesignUrls(limit = 16): Promise<string[]> {
  const html = await fetchHtml("https://recent.design/");
  const paths = unique(
    Array.from(html.matchAll(/href="(\/i\/[a-z0-9-]+)"/g), (m) => m[1])
  ).filter((path) => PRODUCT_UI_SLUG.test(path));
  return paths.slice(0, limit).map((path) => `https://recent.design${path}`);
}

type LayerVisual = {
  url: string;
  title: string;
  excerpt: string | null;
  image: string;
  authorName: string | null;
  authorHandle: string | null;
  externalId: string;
};

/** Layers.to — public posts API, still-image layers only. */
async function discoverLayersVisuals(limit = 28): Promise<LayerVisual[]> {
  const response = await fetch("https://layers.to/api/v1/posts?take=60", {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`layers posts → ${response.status}`);
  const payload = (await response.json()) as {
    data?: Array<{
      id: string;
      user?: { username?: string; fullName?: string | null };
      layers?: Array<{
        id: string;
        title?: string | null;
        description?: string | null;
        imageUrl?: string | null;
      }>;
    }>;
  };

  const out: LayerVisual[] = [];
  for (const post of payload.data ?? []) {
    for (const layer of post.layers ?? []) {
      const image = normalizeImageUrl(layer.imageUrl);
      if (!image || !isStillImage(image)) continue;
      const title = layer.title?.trim() || "Untitled layer";
      // Skip empty / spammy soft titles without product signal when possible
      out.push({
        url: `https://layers.to/posts/${post.id}`,
        title,
        excerpt: layer.description?.trim()?.slice(0, 320) || null,
        image,
        authorName: post.user?.fullName?.trim() || null,
        authorHandle: post.user?.username?.trim() || null,
        externalId: layer.id,
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

type Db = ReturnType<typeof drizzle<typeof schema>>;

async function upsertResolvedVisual(
  db: Db,
  pageUrl: string
): Promise<"created" | "updated" | "skipped" | "rejected"> {
  let resolved;
  try {
    resolved = await resolveImportUrl(pageUrl);
  } catch {
    return "rejected";
  }

  const image = normalizeImageUrl(resolved.image);
  if (!image || !resolved.title?.trim() || !isStillImage(image)) {
    return "rejected";
  }
  if (
    /\/og\.png/i.test(image) ||
    /opengraph-image\.png/i.test(image) ||
    /one-page-love-meta/i.test(image) ||
    /Link-Share-Img/i.test(image)
  ) {
    return "rejected";
  }

  return upsertRow(db, {
    type: "visual",
    title: resolved.title,
    excerpt: resolved.excerpt,
    image,
    url: resolved.url,
    sourceUrl: resolved.sourceUrl,
    sourcePlatform: resolved.sourcePlatform,
    externalId: resolved.externalId,
    authorHandle: resolved.authorHandle,
    authorName: resolved.authorName,
  });
}

async function upsertLayerVisual(
  db: Db,
  layer: LayerVisual
): Promise<"created" | "updated" | "skipped" | "rejected"> {
  return upsertRow(db, {
    type: "visual",
    title: layer.title,
    excerpt: layer.excerpt,
    image: layer.image,
    url: layer.url,
    sourceUrl: layer.url,
    sourcePlatform: "layers",
    externalId: layer.externalId,
    authorHandle: layer.authorHandle,
    authorName: layer.authorName,
  });
}

async function upsertRow(
  db: Db,
  values: {
    type: "visual";
    title: string;
    excerpt: string | null;
    image: string;
    url: string;
    sourceUrl: string;
    sourcePlatform: string;
    externalId: string | null;
    authorHandle: string | null;
    authorName: string | null;
  }
): Promise<"created" | "updated" | "skipped" | "rejected"> {
  const existing = values.externalId
    ? await db.query.content.findFirst({
        where: and(
          eq(content.sourcePlatform, values.sourcePlatform),
          eq(content.externalId, values.externalId)
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
        title: values.title,
        excerpt: values.excerpt,
        image: values.image,
        authorName: values.authorName,
        authorHandle: values.authorHandle,
        publishedAt: existing.publishedAt ?? new Date(),
        featured: false,
      })
      .where(eq(content.id, existing.id));
    return "updated";
  }

  await db.insert(content).values({
    ...values,
    status: "published",
    featured: false,
    publishedAt: new Date(),
  });
  return "created";
}

async function demoteGenericVisuals(db: Db) {
  // Platform firehoses + Spotted (non-thumbnail OG frames)
  const byPlatform = await db
    .update(content)
    .set({ status: "draft", featured: false })
    .where(
      and(
        eq(content.type, "visual"),
        eq(content.status, "published"),
        inArray(content.sourcePlatform, [
          "behance",
          "awwwards",
          "spottedinprod",
        ])
      )
    )
    .returning({ id: content.id });

  // URL-host firehoses we no longer want on the live tab
  const byHost = await db.execute(sql`
    update content
    set status = 'draft', featured = false
    where type = 'visual'
      and status = 'published'
      and (
        url ilike '%saaslandingpage.com%'
        or source_url ilike '%saaslandingpage.com%'
        or url ilike '%onepagelove.com%'
        or source_url ilike '%onepagelove.com%'
        or url ilike '%httpster.net%'
        or source_url ilike '%httpster.net%'
        or url ilike '%spottedinprod.com%'
        or source_url ilike '%spottedinprod.com%'
      )
    returning id
  `);

  return byPlatform.length + (Array.isArray(byHost) ? byHost.length : 0);
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

  console.log("Discovering Layers still-image layers…");
  let layers: LayerVisual[] = [];
  try {
    layers = await discoverLayersVisuals(28);
    console.log(`  ${layers.length}`);
  } catch (error) {
    console.log(
      `  ✗ ${error instanceof Error ? error.message : "layers failed"}`
    );
  }

  console.log("Discovering selective recent.design product/UI…");
  const recent = await discoverRecentDesignUrls(16);
  console.log(`  ${recent.length}`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let rejected = 0;

  async function handle(
    label: string,
    result: "created" | "updated" | "skipped" | "rejected"
  ) {
    if (result === "created") {
      created += 1;
      console.log(`  ✓ ${label}`);
    } else if (result === "updated") {
      updated += 1;
      console.log(`  ↑ ${label}`);
    } else if (result === "skipped") skipped += 1;
    else rejected += 1;
  }

  for (const layer of layers) {
    if (dryRun || !db) {
      console.log(`  · layers ${layer.title.slice(0, 60)}`);
      created += 1;
      continue;
    }
    await handle(layer.title.slice(0, 70), await upsertLayerVisual(db, layer));
  }

  for (const pageUrl of recent) {
    if (dryRun || !db) {
      console.log(`  · recent ${pageUrl}`);
      created += 1;
      continue;
    }
    await handle(pageUrl, await upsertResolvedVisual(db, pageUrl));
  }

  let demoted = 0;
  if (db && !dryRun) {
    demoted = await demoteGenericVisuals(db);
    console.log(`\nDemoted generic visuals → draft: ${demoted}`);
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
