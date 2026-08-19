import type { ContentType, Event } from "@/db/schema";
import type { ContentWithMaker } from "@/lib/demo-data";

/** Public feed filter tabs — intentional, not a noisy timeline. */
export const FEED_FILTERS = [
  "all",
  "articles",
  "visuals",
  "events",
] as const;

export type FeedFilter = (typeof FEED_FILTERS)[number];

export function isFeedFilter(value: string): value is FeedFilter {
  return (FEED_FILTERS as readonly string[]).includes(value);
}

export type FeedContentItem = {
  kind: "content";
  id: string;
  item: ContentWithMaker;
};

export type FeedEventItem = {
  kind: "event";
  id: string;
  item: Event;
};

export type FeedItem = FeedContentItem | FeedEventItem;

/** Tight default — quality over quantity. */
const MIX_TARGET = 22;

/**
 * Absolute caps for the curated “All” feed (after featured picks).
 * Hierarchy: Featured → Articles/Thoughts → Visuals → Events → News.
 * Builds retired (retyped as visuals). Average X posts excluded unless featured.
 */
const CAPS = {
  featuredEditorial: 6,
  featuredOther: 2,
  editorial: 12,
  visuals: 5,
  events: 3,
  news: 2,
} as const;

function asTime(value: Date | string | null | undefined) {
  if (!value) return 0;
  const time =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function publishedAtMs(item: ContentWithMaker) {
  return asTime(item.publishedAt ?? item.createdAt);
}

function hasImage(item: ContentWithMaker) {
  return Boolean(item.image?.trim());
}

function hasSubstance(item: ContentWithMaker) {
  const excerpt = item.excerpt?.trim() ?? "";
  return excerpt.length >= 80 || Boolean(item.body?.trim());
}

/** Treat legacy builds as visuals in ranking. */
function effectiveType(item: ContentWithMaker): ContentType {
  return item.type === "build" ? "visual" : item.type;
}

function sortQuality(a: ContentWithMaker, b: ContentWithMaker) {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  const aScore =
    (hasSubstance(a) ? 2 : 0) +
    (hasImage(a) ? 1 : 0) +
    (a.readingTimeMinutes ? 1 : 0);
  const bScore =
    (hasSubstance(b) ? 2 : 0) +
    (hasImage(b) ? 1 : 0) +
    (b.readingTimeMinutes ? 1 : 0);
  if (aScore !== bScore) return bScore - aScore;
  return publishedAtMs(b) - publishedAtMs(a);
}

function takeByTypes(
  pool: ContentWithMaker[],
  types: ContentType[],
  count: number,
  predicate?: (item: ContentWithMaker) => boolean
) {
  const allowed = new Set(types);
  return pool
    .filter((item) => allowed.has(effectiveType(item)))
    .filter((item) => (predicate ? predicate(item) : true))
    .sort(sortQuality)
    .slice(0, Math.max(0, count));
}

function upcomingEvents(events: Event[], count: number) {
  const now = Date.now();
  return [...events]
    .filter((event) => asTime(event.startDate) >= now - 12 * 60 * 60 * 1000)
    .sort((a, b) => asTime(a.startDate) - asTime(b.startDate))
    .slice(0, Math.max(0, count));
}

function toContentItems(items: ContentWithMaker[]): FeedContentItem[] {
  return items.map((item) => ({
    kind: "content" as const,
    id: `content:${item.id}`,
    item,
  }));
}

function toEventItems(items: Event[]): FeedEventItem[] {
  return items.map((item) => ({
    kind: "event" as const,
    id: `event:${item.id}`,
    item,
  }));
}

/**
 * Editorial-weighted interleave: writing appears more often than the rest.
 */
function interleaveEditorialFirst(buckets: {
  editorial: FeedItem[];
  visuals: FeedItem[];
  events: FeedItem[];
  news: FeedItem[];
}): FeedItem[] {
  const q = {
    editorial: [...buckets.editorial],
    visuals: [...buckets.visuals],
    events: [...buckets.events],
    news: [...buckets.news],
  };

  const out: FeedItem[] = [];
  const pattern = [
    "editorial",
    "visuals",
    "editorial",
    "events",
    "editorial",
    "news",
    "editorial",
  ] as const;

  let guard = 0;
  while (guard < 200) {
    guard += 1;
    let progressed = false;
    for (const key of pattern) {
      const next = q[key].shift();
      if (!next) continue;
      out.push(next);
      progressed = true;
    }
    if (!progressed) break;
  }

  for (const key of ["editorial", "visuals", "events", "news"] as const) {
    out.push(...q[key]);
  }

  return out;
}

/**
 * Premium home mix — tight, featured-led, writing-first.
 */
export function curateHomeFeed(
  content: ContentWithMaker[],
  events: Event[],
  target = MIX_TARGET
): FeedItem[] {
  const featuredEditorial = takeByTypes(
    content.filter((item) => item.featured),
    ["article", "thought"],
    CAPS.featuredEditorial
  );

  const featuredOther = content
    .filter(
      (item) =>
        item.featured &&
        !featuredEditorial.some((f) => f.id === item.id) &&
        effectiveType(item) !== "post"
    )
    .sort(sortQuality)
    .slice(0, CAPS.featuredOther);

  const featuredPost = content
    .filter((item) => item.featured && item.type === "post")
    .sort(sortQuality)
    .slice(0, 1);

  const used = new Set(
    [...featuredEditorial, ...featuredOther, ...featuredPost].map((i) => i.id)
  );
  const remaining = content.filter((item) => !used.has(item.id));

  const editorial = takeByTypes(
    remaining,
    ["article", "thought"],
    CAPS.editorial,
    (item) => hasSubstance(item) || item.featured
  );
  editorial.forEach((item) => used.add(item.id));

  const visuals = takeByTypes(
    remaining.filter((item) => !used.has(item.id)),
    ["visual", "build"],
    CAPS.visuals,
    (item) => hasImage(item)
  );
  visuals.forEach((item) => used.add(item.id));

  const news = takeByTypes(
    remaining.filter((item) => !used.has(item.id)),
    ["news"],
    CAPS.news,
    (item) => hasSubstance(item)
  );

  const eventPicks = upcomingEvents(events, CAPS.events);

  const mixed = interleaveEditorialFirst({
    editorial: toContentItems(editorial),
    visuals: toContentItems(visuals),
    events: toEventItems(eventPicks),
    news: toContentItems(news),
  });

  return [
    ...toContentItems(featuredEditorial),
    ...toContentItems(featuredOther),
    ...toContentItems(featuredPost),
    ...mixed,
  ].slice(0, target);
}

export function filterFeedItems(
  filter: FeedFilter,
  content: ContentWithMaker[],
  events: Event[]
): FeedItem[] {
  switch (filter) {
    case "all":
      return curateHomeFeed(content, events);
    case "articles":
      return toContentItems(
        takeByTypes(content, ["article", "thought"], 28, (item) =>
          Boolean(item.featured || hasSubstance(item))
        )
      );
    case "visuals":
      return toContentItems(
        takeByTypes(content, ["visual", "build"], 24, (item) => hasImage(item))
      );
    case "events":
      return toEventItems(upcomingEvents(events, 24));
  }
}
