import type { ContentType, Event } from "@/db/schema";
import type { ContentWithMaker } from "@/lib/demo-data";

/**
 * Public feed tabs — writing first.
 * No “All” mix: Articles is the default home.
 */
export const FEED_FILTERS = ["articles", "visuals", "events"] as const;

export type FeedFilter = (typeof FEED_FILTERS)[number];

export const DEFAULT_FEED_FILTER: FeedFilter = "articles";

export function isFeedFilter(value: string): value is FeedFilter {
  return (FEED_FILTERS as readonly string[]).includes(value);
}

/** Map legacy `?type=all` (and missing type) to Articles. */
export function resolveFeedFilter(raw: string | null | undefined): FeedFilter {
  if (!raw || raw === "all") return DEFAULT_FEED_FILTER;
  return isFeedFilter(raw) ? raw : DEFAULT_FEED_FILTER;
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
 * Builds retired (retyped as visuals). X posts live in a secondary strip — never All.
 */
const CAPS = {
  featuredEditorial: 6,
  featuredOther: 2,
  /** Community writing from signed-in designers — reserved near the top. */
  designerWriting: 3,
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

/** Article/thought authored by a registered designer (profile), not just ingested. */
export function isDesignerWriting(item: ContentWithMaker) {
  const type = effectiveType(item);
  if (type !== "article" && type !== "thought") return false;
  return Boolean(item.authorProfileId ?? item.authorProfile?.id ?? null);
}

/** Product/UI inspiration hosts — elevated on the Visuals tab. */
const PRODUCT_UI_PLATFORMS = new Set([
  "spottedinprod",
  "layers",
]);

function productUiBoost(item: ContentWithMaker) {
  if (PRODUCT_UI_PLATFORMS.has(item.sourcePlatform ?? "")) return 4;
  const host = (() => {
    try {
      return new URL(item.url || item.sourceUrl || "").hostname.replace(
        /^www\./,
        ""
      );
    } catch {
      return "";
    }
  })();
  if (host === "recent.design" || host.endsWith(".recent.design")) return 2;
  if (host === "handheld.design" || host.endsWith(".handheld.design")) return 2;
  return 0;
}

function sortQuality(a: ContentWithMaker, b: ContentWithMaker) {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  const aScore =
    productUiBoost(a) +
    (hasSubstance(a) ? 2 : 0) +
    (hasImage(a) ? 1 : 0) +
    (a.readingTimeMinutes ? 1 : 0);
  const bScore =
    productUiBoost(b) +
    (hasSubstance(b) ? 2 : 0) +
    (hasImage(b) ? 1 : 0) +
    (b.readingTimeMinutes ? 1 : 0);
  if (aScore !== bScore) return bScore - aScore;
  return publishedAtMs(b) - publishedAtMs(a);
}

/** Stable copy used by the Visuals filter before takeByTypes. */
function prioritizeProductUiVisuals(content: ContentWithMaker[]) {
  return [...content].sort(sortQuality);
}

/**
 * Stable author key for diversity — prefer profile/maker ids, then handle/name.
 * Keeps “Robin Rendle × N” from flooding the curated All mix.
 */
/**
 * Feed / platform bylines are not real authors. Collapsing every Behance
 * project under “Behance Projects” left the Visuals tab with only 2 tiles.
 */
const PLATFORM_BYLINES = new Set([
  "behance",
  "behance projects",
  "awwwards",
  "awwwards blog",
  "awwwards - sites of the day",
  "sites of the day",
  "dezeen",
  "designboom",
  "sidebar",
  "dribbble",
  "dribbble stories",
  "css-tricks",
  "smashing magazine",
  "sit with design",
]);

export function authorKey(item: ContentWithMaker): string {
  if (item.authorProfileId) return `profile:${item.authorProfileId}`;
  if (item.authorProfile?.id) return `profile:${item.authorProfile.id}`;
  if (item.makerId) return `maker:${item.makerId}`;
  if (item.maker?.id) return `maker:${item.maker.id}`;

  const handle = (
    item.authorHandle ??
    item.authorProfile?.handle ??
    item.maker?.handle ??
    ""
  )
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  if (handle) return `handle:${handle}`;

  const name = (
    item.authorName ??
    item.authorProfile?.displayName ??
    item.maker?.name ??
    ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (name && !PLATFORM_BYLINES.has(name)) return `name:${name}`;

  // Prefer stable external ids so inspiration grids stay diverse.
  if (item.externalId) {
    return `ext:${item.sourcePlatform ?? "web"}:${item.externalId}`;
  }

  return `item:${item.id}`;
}

/** Keep first N items per author (already-sorted pools). */
function diversifyAuthors(
  items: ContentWithMaker[],
  maxPerAuthor = 1,
  seen: Set<string> = new Set()
): ContentWithMaker[] {
  const out: ContentWithMaker[] = [];
  const counts = new Map<string, number>();

  for (const key of seen) counts.set(key, maxPerAuthor);

  for (const item of items) {
    const key = authorKey(item);
    const used = counts.get(key) ?? 0;
    if (used >= maxPerAuthor) continue;
    counts.set(key, used + 1);
    seen.add(key);
    out.push(item);
  }

  return out;
}

function takeByTypes(
  pool: ContentWithMaker[],
  types: ContentType[],
  count: number,
  predicate?: (item: ContentWithMaker) => boolean,
  options?: { maxPerAuthor?: number; seenAuthors?: Set<string> }
) {
  const allowed = new Set(types);
  const ranked = pool
    .filter((item) => allowed.has(effectiveType(item)))
    .filter((item) => (predicate ? predicate(item) : true))
    .sort(sortQuality);

  const diversified =
    options?.maxPerAuthor != null
      ? diversifyAuthors(
          ranked,
          options.maxPerAuthor,
          options.seenAuthors ?? new Set()
        )
      : ranked;

  return diversified.slice(0, Math.max(0, count));
}

/** Still upcoming if end (or start) hasn’t passed — 2h grace for “happening now”. */
export function isUpcomingEvent(
  event: Pick<Event, "startDate" | "endDate">,
  now = Date.now(),
  graceMs = 2 * 60 * 60 * 1000
) {
  const end = asTime(event.endDate ?? event.startDate);
  return end >= now - graceMs;
}

function upcomingEvents(events: Event[], count: number) {
  return [...events]
    .filter((event) => isUpcomingEvent(event))
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
 * Max one piece per author across the whole All selection.
 */
export function curateHomeFeed(
  content: ContentWithMaker[],
  events: Event[],
  target = MIX_TARGET
): FeedItem[] {
  const seenAuthors = new Set<string>();

  const featuredEditorial = takeByTypes(
    content.filter((item) => item.featured),
    ["article", "thought"],
    CAPS.featuredEditorial,
    undefined,
    { maxPerAuthor: 1, seenAuthors }
  );

  const featuredOther = diversifyAuthors(
    content
      .filter(
        (item) =>
          item.featured &&
          !featuredEditorial.some((f) => f.id === item.id) &&
          effectiveType(item) !== "post"
      )
      .sort(sortQuality),
    1,
    seenAuthors
  ).slice(0, CAPS.featuredOther);

  // X posts never enter the main selection — see LiveFromX strip.
  const used = new Set(
    [...featuredEditorial, ...featuredOther].map((i) => i.id)
  );
  const remaining = content.filter(
    (item) => !used.has(item.id) && effectiveType(item) !== "post"
  );

  // Designer-published writing — reserved after editor’s picks, before the mix.
  const designerWriting = takeByTypes(
    remaining,
    ["article", "thought"],
    CAPS.designerWriting,
    (item) => isDesignerWriting(item) && (hasSubstance(item) || item.featured),
    { maxPerAuthor: 1, seenAuthors }
  );
  designerWriting.forEach((item) => used.add(item.id));

  const editorial = takeByTypes(
    remaining.filter((item) => !used.has(item.id)),
    ["article", "thought"],
    CAPS.editorial,
    (item) => hasSubstance(item) || item.featured,
    { maxPerAuthor: 1, seenAuthors }
  );
  editorial.forEach((item) => used.add(item.id));

  const visuals = takeByTypes(
    remaining.filter((item) => !used.has(item.id)),
    ["visual", "build"],
    CAPS.visuals,
    (item) => hasImage(item),
    { maxPerAuthor: 1, seenAuthors }
  );
  visuals.forEach((item) => used.add(item.id));

  const news = takeByTypes(
    remaining.filter((item) => !used.has(item.id)),
    ["news"],
    CAPS.news,
    (item) => hasSubstance(item),
    { maxPerAuthor: 1, seenAuthors }
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
    ...toContentItems(designerWriting),
    ...mixed,
  ].slice(0, target);
}

/** Recent community writing for the home strip (newest first). */
export function pickDesignerWriting(
  content: ContentWithMaker[],
  count = 3
): ContentWithMaker[] {
  return diversifyAuthors(
    content
      .filter(
        (item) =>
          isDesignerWriting(item) && (hasSubstance(item) || item.featured)
      )
      .sort((a, b) => publishedAtMs(b) - publishedAtMs(a)),
    1
  ).slice(0, Math.max(0, count));
}

function liveFromXScore(item: ContentWithMaker) {
  const text = `${item.title}\n${item.excerpt ?? ""}`.trim();
  let score = Math.min(text.length, 280);
  if (/\?/.test(text)) score += 20;
  if ((item.excerpt?.split(/\s+/).length ?? 0) >= 18) score += 30;
  if (/pic\.twitter\.com|t\.co\//i.test(text) && text.length < 120) score -= 40;
  if (/✨|🤓|😉/.test(text)) score -= 25;
  return score;
}

/** Quiet secondary surface — a few recent craft notes from X. */
export function pickLiveFromX(
  content: ContentWithMaker[],
  count = 4
): ContentWithMaker[] {
  const ranked = content
    .filter((item) => item.type === "post")
    .filter((item) => {
      const text = `${item.title}\n${item.excerpt ?? ""}`.trim();
      return text.length >= 50;
    })
    .sort((a, b) => {
      const score = liveFromXScore(b) - liveFromXScore(a);
      if (score !== 0) return score;
      return publishedAtMs(b) - publishedAtMs(a);
    });

  return diversifyAuthors(ranked, 1).slice(0, Math.max(0, count));
}

export function filterFeedItems(
  filter: FeedFilter,
  content: ContentWithMaker[],
  events: Event[]
): FeedItem[] {
  switch (filter) {
    case "articles":
      // Default home — writing first, still avoid a single-writer flood.
      return toContentItems(
        takeByTypes(
          content,
          ["article", "thought"],
          28,
          (item) => Boolean(item.featured || hasSubstance(item)),
          { maxPerAuthor: 2 }
        )
      );
    case "visuals":
      // Tight high-bar grid (~30–32). Prefer product/UI sources in sortQuality.
      return toContentItems(
        takeByTypes(
          prioritizeProductUiVisuals(content),
          ["visual", "build"],
          32,
          (item) => hasImage(item),
          { maxPerAuthor: 4 }
        )
      );
    case "events":
      return toEventItems(upcomingEvents(events, 24));
  }
}
