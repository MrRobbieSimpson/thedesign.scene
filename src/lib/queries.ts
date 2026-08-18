import { unstable_cache } from "next/cache";
import { and, eq, sql } from "drizzle-orm";

import {
  content,
  events,
  makers,
  profiles,
  type ContentType,
  type Event,
} from "@/db/schema";
import { db, isDatabaseConfigured } from "@/db";
import {
  demoEvents,
  demoMakers,
  filterDemoContent,
  type ContentWithMaker,
} from "@/lib/demo-data";

const FEED_POOL_LIMIT = 120;
const FEED_REVALIDATE_SECONDS = 60;

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

/** `unstable_cache` serializes Dates to strings — revive after read. */
function reviveContent(item: ContentWithMaker): ContentWithMaker {
  return {
    ...item,
    publishedAt: asDate(item.publishedAt),
    createdAt: asDate(item.createdAt) ?? new Date(0),
    updatedAt: asDate(item.updatedAt) ?? new Date(0),
  };
}

function reviveEvent(event: Event): Event {
  return {
    ...event,
    startDate: asDate(event.startDate) ?? new Date(0),
    endDate: asDate(event.endDate),
    createdAt: asDate(event.createdAt) ?? new Date(0),
    updatedAt: asDate(event.updatedAt) ?? new Date(0),
  };
}

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
  const rows = await unstable_cache(
    () => fetchPublishedContent(type),
    ["published-content", type, "v5"],
    { revalidate: FEED_REVALIDATE_SECONDS, tags: ["content"] }
  )();
  return rows.map(reviveContent);
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
  const rows = await unstable_cache(
    () => fetchPublishedEvents(),
    ["published-events", "v3"],
    {
      revalidate: FEED_REVALIDATE_SECONDS,
      tags: ["events"],
    }
  )();
  return rows.map(reviveEvent);
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

/**
 * Registered designers = local profiles created after Clerk sign-up.
 * Falls back to curated makers count when DB is offline.
 */
export async function getRegisteredDesignerCount(): Promise<number> {
  if (!isDatabaseConfigured() || !db) {
    return demoMakers.length;
  }

  return unstable_cache(
    async () => {
      const [profileRow] = await db!
        .select({ count: sql<number>`count(*)::int` })
        .from(profiles);
      const registered = Number(profileRow?.count ?? 0);
      if (registered > 0) return registered;

      // Before the first sign-ups, surface curated makers so the scene
      // still feels inhabited.
      const [makerRow] = await db!
        .select({ count: sql<number>`count(*)::int` })
        .from(makers);
      return Number(makerRow?.count ?? 0);
    },
    ["registered-designer-count", "v1"],
    { revalidate: 30, tags: ["profiles", "makers"] }
  )();
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
