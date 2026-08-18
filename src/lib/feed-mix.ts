import type { ContentType, Event } from "@/db/schema";
import type { ContentWithMaker } from "@/lib/demo-data";

/** Public feed filter tabs (Events lives in the same feed surface). */
export const FEED_FILTERS = [
  "all",
  "articles",
  "visuals",
  "builds",
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

const MIX_TARGET = 36;

/** Target share of the curated “All” feed (approx). */
const MIX_SHARES = {
  editorial: 0.4, // article + thought
  visual: 0.2,
  build: 0.18,
  event: 0.12,
  newsy: 0.1, // news + post — hard cap
} as const;

function publishedAtMs(item: ContentWithMaker) {
  return (item.publishedAt ?? item.createdAt).getTime();
}

function takeByType(
  pool: ContentWithMaker[],
  types: ContentType[],
  count: number
) {
  const allowed = new Set(types);
  return pool
    .filter((item) => allowed.has(item.type))
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return publishedAtMs(b) - publishedAtMs(a);
    })
    .slice(0, Math.max(0, count));
}

function upcomingEvents(events: Event[], count: number) {
  const now = Date.now();
  return [...events]
    .filter((event) => event.startDate.getTime() >= now - 12 * 60 * 60 * 1000)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
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
 * Interleave buckets so the feed reads as a curated mix
 * rather than a chronological news dump.
 */
function interleave(buckets: FeedItem[][]): FeedItem[] {
  const queues = buckets.map((bucket) => [...bucket]);
  const out: FeedItem[] = [];
  let progressed = true;

  while (progressed) {
    progressed = false;
    for (const queue of queues) {
      const next = queue.shift();
      if (!next) continue;
      out.push(next);
      progressed = true;
    }
  }

  return out;
}

/**
 * Curate the home “All” feed toward the desired taste mix.
 * Featured editorial pieces lead; news/posts are capped.
 */
export function curateHomeFeed(
  content: ContentWithMaker[],
  events: Event[],
  target = MIX_TARGET
): FeedItem[] {
  const featuredEditorial = takeByType(
    content.filter((item) => item.featured),
    ["article", "thought"],
    6
  );
  const featuredRest = content
    .filter(
      (item) =>
        item.featured &&
        item.type !== "article" &&
        item.type !== "thought" &&
        !featuredEditorial.some((f) => f.id === item.id)
    )
    .sort((a, b) => publishedAtMs(b) - publishedAtMs(a))
    .slice(0, 3);

  const used = new Set(
    [...featuredEditorial, ...featuredRest].map((item) => item.id)
  );
  const remaining = content.filter((item) => !used.has(item.id));

  const featuredCount = featuredEditorial.length + featuredRest.length;
  const slots = Math.max(target - featuredCount, 12);

  const editorial = takeByType(
    remaining,
    ["article", "thought"],
    Math.round(slots * MIX_SHARES.editorial)
  );
  editorial.forEach((item) => used.add(item.id));

  const visuals = takeByType(
    remaining.filter((item) => !used.has(item.id)),
    ["visual"],
    Math.round(slots * MIX_SHARES.visual)
  );
  visuals.forEach((item) => used.add(item.id));

  const builds = takeByType(
    remaining.filter((item) => !used.has(item.id)),
    ["build"],
    Math.round(slots * MIX_SHARES.build)
  );
  builds.forEach((item) => used.add(item.id));

  const newsy = takeByType(
    remaining.filter((item) => !used.has(item.id)),
    ["news", "post"],
    Math.round(slots * MIX_SHARES.newsy)
  );

  const eventPicks = upcomingEvents(
    events,
    Math.round(slots * MIX_SHARES.event)
  );

  const mixed = interleave([
    toContentItems(editorial),
    toContentItems(visuals),
    toContentItems(builds),
    toEventItems(eventPicks),
    toContentItems(newsy),
  ]);

  return [
    ...toContentItems(featuredEditorial),
    ...toContentItems(featuredRest),
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
        takeByType(content, ["article", "thought"], MIX_TARGET)
      );
    case "visuals":
      return toContentItems(takeByType(content, ["visual"], MIX_TARGET));
    case "builds":
      return toContentItems(takeByType(content, ["build"], MIX_TARGET));
    case "events":
      return toEventItems(upcomingEvents(events, MIX_TARGET));
  }
}
