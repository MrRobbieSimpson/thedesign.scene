import { unstable_cache } from "next/cache";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";

import {
  content,
  events,
  guestTerms,
  jobs,
  makers,
  profiles,
  type ContentType,
  type Event,
  type GuestTerm,
  type Job,
  type Profile,
} from "@/db/schema";
import { db, isDatabaseConfigured } from "@/db";
import {
  demoEvents,
  demoMakers,
  filterDemoContent,
  type ContentWithMaker,
} from "@/lib/demo-data";

export type GuestTermWithProfile = GuestTerm & { profile: Profile };

const FEED_POOL_LIMIT = 100;
/** Longer soft cache — feed switches stay fast; admin publish still busts tags. */
const FEED_REVALIDATE_SECONDS = 120;

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

/** Lean columns for feed cards — never ship full body / JSON blobs. */
const feedContentColumns = {
  id: true,
  type: true,
  title: true,
  slug: true,
  readingTimeMinutes: true,
  url: true,
  excerpt: true,
  image: true,
  status: true,
  featured: true,
  editorNote: true,
  makerId: true,
  authorProfileId: true,
  sourcePlatform: true,
  sourceUrl: true,
  externalId: true,
  authorHandle: true,
  authorName: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  body: false,
  sourcePayload: false,
} as const;

const feedMakerColumns = {
  id: true,
  name: true,
  handle: true,
  avatar: true,
  bio: false,
  website: false,
  createdAt: false,
  updatedAt: false,
} as const;

const feedProfileColumns = {
  id: true,
  displayName: true,
  handle: true,
  avatarUrl: true,
  xHandle: true,
  clerkUserId: false,
  bio: false,
  website: false,
  location: false,
  timezone: false,
  links: false,
  makerId: false,
  createdAt: false,
  updatedAt: false,
} as const;

async function fetchPublishedContent(
  type: ContentType | "all" | "writing" | "visuals" = "all",
  limit = FEED_POOL_LIMIT
): Promise<ContentWithMaker[]> {
  if (!isDatabaseConfigured() || !db) {
    if (type === "writing") {
      return [
        ...filterDemoContent("article"),
        ...filterDemoContent("thought"),
      ].slice(0, limit);
    }
    if (type === "visuals") {
      return [
        ...filterDemoContent("visual"),
        ...filterDemoContent("build"),
      ].slice(0, limit);
    }
    return filterDemoContent(type === "all" ? "all" : type).slice(0, limit);
  }

  const conditions = [eq(content.status, "published")];
  if (type === "writing") {
    conditions.push(inArray(content.type, ["article", "thought"]));
  } else if (type === "visuals") {
    conditions.push(inArray(content.type, ["visual", "build"]));
  } else if (type !== "all") {
    conditions.push(eq(content.type, type));
  }

  const rows = await db.query.content.findMany({
    where: and(...conditions),
    columns: feedContentColumns,
    with: {
      maker: { columns: feedMakerColumns },
      authorProfile: { columns: feedProfileColumns },
    },
    orderBy: (fields, { desc: d }) => [
      d(fields.featured),
      d(fields.publishedAt),
      d(fields.createdAt),
    ],
    limit,
  });

  return rows as ContentWithMaker[];
}

/** Cached feed pool — mix/curate in feed-mix.ts rather than dumping chronologically. */
export async function getPublishedContent(
  type: ContentType | "all" = "all"
): Promise<ContentWithMaker[]> {
  const rows = await unstable_cache(
    () => fetchPublishedContent(type),
    ["published-content", type, "v18"],
    { revalidate: FEED_REVALIDATE_SECONDS, tags: ["content"] }
  )();
  return rows.map(reviveContent);
}

/** All published types for the curated home mix. */
export async function getPublishedContentPool(): Promise<ContentWithMaker[]> {
  return getPublishedContent("all");
}

/** Writing tab — one query for articles + thoughts, no bodies. */
export async function getPublishedWritingPool(): Promise<ContentWithMaker[]> {
  const rows = await unstable_cache(
    () => fetchPublishedContent("writing", 60),
    ["published-content", "writing", "v18"],
    { revalidate: FEED_REVALIDATE_SECONDS, tags: ["content"] }
  )();
  return rows.map(reviveContent);
}

/** Visuals tab — visuals + legacy builds only. */
export async function getPublishedVisualsPool(): Promise<ContentWithMaker[]> {
  const rows = await unstable_cache(
    () => fetchPublishedContent("visuals", 48),
    ["published-content", "visuals", "v18"],
    { revalidate: FEED_REVALIDATE_SECONDS, tags: ["content"] }
  )();
  return rows.map(reviveContent);
}

export async function getAllContent(): Promise<ContentWithMaker[]> {
  if (!isDatabaseConfigured() || !db) {
    return filterDemoContent("all", { includeDrafts: true });
  }

  return db.query.content.findMany({
    with: { maker: true, authorProfile: true },
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
    with: { maker: true, authorProfile: true },
  });

  return row ?? null;
}

async function fetchPublishedEvents() {
  if (!isDatabaseConfigured() || !db) {
    return demoEvents
      .filter((event) => event.status === "published")
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  // Omit source_payload — never needed on the public Events UI.
  return db.query.events.findMany({
    where: eq(events.status, "published"),
    columns: {
      id: true,
      title: true,
      description: true,
      url: true,
      location: true,
      latitude: true,
      longitude: true,
      startDate: true,
      endDate: true,
      type: true,
      status: true,
      sourcePlatform: true,
      sourceUrl: true,
      externalId: true,
      createdAt: true,
      updatedAt: true,
      sourcePayload: false,
    },
    orderBy: (fields, { asc }) => [asc(fields.startDate)],
  });
}

export async function getPublishedEvents() {
  const rows = await unstable_cache(
    () => fetchPublishedEvents(),
    ["published-events", "v5"],
    {
      revalidate: FEED_REVALIDATE_SECONDS,
      tags: ["events"],
    }
  )();
  return rows.map((row) => reviveEvent({ ...row, sourcePayload: null }));
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

function reviveJob(job: Job): Job {
  return {
    ...job,
    publishedAt: asDate(job.publishedAt),
    paidAt: asDate(job.paidAt),
    createdAt: asDate(job.createdAt) ?? new Date(0),
    updatedAt: asDate(job.updatedAt) ?? new Date(0),
  };
}

async function fetchPublishedJobs() {
  if (!isDatabaseConfigured() || !db) return [];

  return db.query.jobs.findMany({
    where: eq(jobs.status, "published"),
    orderBy: (fields, { desc: d }) => [
      d(fields.publishedAt),
      d(fields.createdAt),
    ],
  });
}

export async function getPublishedJobs() {
  const rows = await unstable_cache(
    () => fetchPublishedJobs(),
    ["published-jobs", "v2"],
    {
      revalidate: FEED_REVALIDATE_SECONDS,
      tags: ["jobs"],
    }
  )();
  return rows.map(reviveJob);
}

/** Lean count for the header badge — avoid loading every job on each page. */
export async function getPublishedJobCount(): Promise<number> {
  if (!isDatabaseConfigured() || !db) return 0;

  return unstable_cache(
    async () => {
      const [row] = await db!
        .select({ count: sql<number>`count(*)::int` })
        .from(jobs)
        .where(eq(jobs.status, "published"));
      return Number(row?.count ?? 0);
    },
    ["published-job-count", "v1"],
    {
      revalidate: FEED_REVALIDATE_SECONDS,
      tags: ["jobs"],
    }
  )();
}

export async function getAllJobs() {
  if (!isDatabaseConfigured() || !db) return [];

  return db.query.jobs.findMany({
    orderBy: (fields, { desc: d }) => [d(fields.createdAt)],
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
    with: { maker: true, authorProfile: true },
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
    with: { maker: true, authorProfile: true },
    orderBy: (fields, { desc: d }) => [
      d(fields.publishedAt),
      d(fields.createdAt),
    ],
  });
}

export async function getProfileByHandle(handle: string) {
  if (!isDatabaseConfigured() || !db) return null;

  return (
    (await db.query.profiles.findFirst({
      where: eq(profiles.handle, handle),
    })) ?? null
  );
}

export async function getProfiles() {
  if (!isDatabaseConfigured() || !db) return [];
  return db.query.profiles.findMany({
    orderBy: (fields, { asc }) => [asc(fields.displayName)],
  });
}

export async function getPublishedContentByProfile(profileId: string) {
  if (!isDatabaseConfigured() || !db) return [];

  return db.query.content.findMany({
    where: and(
      eq(content.status, "published"),
      eq(content.authorProfileId, profileId)
    ),
    with: { maker: true, authorProfile: true },
    orderBy: (fields, { desc: d }) => [
      d(fields.publishedAt),
      d(fields.createdAt),
    ],
  });
}

export async function getActiveGuestTerm(profileId: string) {
  if (!isDatabaseConfigured() || !db) return null;

  const now = new Date();
  return (
    (await db.query.guestTerms.findFirst({
      where: and(
        eq(guestTerms.profileId, profileId),
        lte(guestTerms.startsAt, now),
        gte(guestTerms.endsAt, now)
      ),
      orderBy: (fields, { desc: d }) => [d(fields.startsAt)],
    })) ?? null
  );
}

export async function getCurrentGuestEditor(): Promise<GuestTermWithProfile | null> {
  if (!isDatabaseConfigured() || !db) return null;

  const now = new Date();
  const row = await db.query.guestTerms.findFirst({
    where: and(lte(guestTerms.startsAt, now), gte(guestTerms.endsAt, now)),
    with: { profile: true },
    orderBy: (fields, { desc: d }) => [d(fields.startsAt)],
  });

  return row ?? null;
}
