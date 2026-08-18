import { unstable_cache } from "next/cache";
import { and, eq } from "drizzle-orm";

import { content, events, type ContentType } from "@/db/schema";
import { db, isDatabaseConfigured } from "@/db";
import {
  demoEvents,
  demoMakers,
  filterDemoContent,
  type ContentWithMaker,
} from "@/lib/demo-data";

const FEED_POOL_LIMIT = 120;
const FEED_REVALIDATE_SECONDS = 60;

async function fetchPublishedContent(
  type: ContentType | "all" = "all",
  limit = FEED_POOL_LIMIT
): Promise<ContentWithMaker[]> {
  if (!isDatabaseConfigured() || !db) {
    return filterDemoContent(type).slice(0, limit);
  }

  const conditions = [eq(content.status, "published")];
  if (type !== "all") {
    conditions.push(eq(content.type, type));
  }

  const rows = await db.query.content.findMany({
    where: and(...conditions),
    with: { maker: true },
    orderBy: (fields, { desc: d }) => [
      d(fields.featured),
      d(fields.publishedAt),
      d(fields.createdAt),
    ],
    limit,
  });

  return rows;
}

/** Cached feed pool — mix/curate in feed-mix.ts rather than dumping chronologically. */
export async function getPublishedContent(
  type: ContentType | "all" = "all"
): Promise<ContentWithMaker[]> {
  return unstable_cache(
    () => fetchPublishedContent(type),
    ["published-content", type, "v2"],
    { revalidate: FEED_REVALIDATE_SECONDS, tags: ["content"] }
  )();
}

/** All published types for the curated home mix. */
export async function getPublishedContentPool(): Promise<ContentWithMaker[]> {
  return getPublishedContent("all");
}

export async function getAllContent(): Promise<ContentWithMaker[]> {
  if (!isDatabaseConfigured() || !db) {
    return filterDemoContent("all", { includeDrafts: true });
  }

  return db.query.content.findMany({
    with: { maker: true },
    orderBy: (fields, { desc: d }) => [d(fields.createdAt)],
  });
}

export async function getContentById(
  id: string
): Promise<ContentWithMaker | null> {
  if (!isDatabaseConfigured() || !db) {
    return filterDemoContent("all", { includeDrafts: true }).find(
      (item) => item.id === id
    ) ?? null;
  }

  const row = await db.query.content.findFirst({
    where: eq(content.id, id),
    with: { maker: true },
  });

  return row ?? null;
}

async function fetchPublishedEvents() {
  if (!isDatabaseConfigured() || !db) {
    return demoEvents
      .filter((event) => event.status === "published")
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  return db.query.events.findMany({
    where: eq(events.status, "published"),
    orderBy: (fields, { asc }) => [asc(fields.startDate)],
  });
}

export async function getPublishedEvents() {
  return unstable_cache(() => fetchPublishedEvents(), ["published-events"], {
    revalidate: FEED_REVALIDATE_SECONDS,
    tags: ["events"],
  })();
}

export async function getAllEvents() {
  if (!isDatabaseConfigured() || !db) {
    return [...demoEvents].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );
  }

  return db.query.events.findMany({
    orderBy: (fields, { asc }) => [asc(fields.startDate)],
  });
}

export async function getMakers() {
  if (!isDatabaseConfigured() || !db) {
    return demoMakers;
  }

  return db.query.makers.findMany({
    orderBy: (fields, { asc }) => [asc(fields.name)],
  });
}

export async function getContentBySlug(
  slug: string
): Promise<ContentWithMaker | null> {
  if (!isDatabaseConfigured() || !db) {
    return (
      filterDemoContent("all", { includeDrafts: true }).find(
        (item) => item.slug === slug
      ) ?? null
    );
  }

  const row = await db.query.content.findFirst({
    where: eq(content.slug, slug),
    with: { maker: true },
  });

  return row ?? null;
}

export async function getMakerByHandle(handle: string) {
  if (!isDatabaseConfigured() || !db) {
    return demoMakers.find((maker) => maker.handle === handle) ?? null;
  }

  return (
    (await db.query.makers.findFirst({
      where: (fields, { eq: e }) => e(fields.handle, handle),
    })) ?? null
  );
}

export async function getPublishedContentByMaker(makerId: string) {
  if (!isDatabaseConfigured() || !db) {
    return filterDemoContent("all").filter((item) => item.makerId === makerId);
  }

  return db.query.content.findMany({
    where: and(eq(content.status, "published"), eq(content.makerId, makerId)),
    with: { maker: true },
    orderBy: (fields, { desc: d }) => [
      d(fields.publishedAt),
      d(fields.createdAt),
    ],
  });
}
