import type { ContentType } from "@/db/schema";
import { WRITER_FEEDS } from "@/lib/ingest/designer-writers";
import type { SourcePlatform } from "@/lib/ingest/types";

export type FeedSource = {
  id: string;
  name: string;
  feedUrl: string;
  platform: SourcePlatform;
  defaultType: ContentType;
  siteUrl: string;
  description?: string;
  /** When true, pull script treats this as writing-first (higher limit). */
  writing?: boolean;
};

function platformForWriter(id: string): SourcePlatform {
  if (id === "smashing") return "smashing";
  if (id === "uxdesign" || id === "medium-product-design") return "medium";
  if (id === "handheld") return "handheld";
  if (id === "dribbble-stories") return "dribbble";
  if (id === "figma-blog") return "web";
  return "web";
}

/** Writing-first feeds from curated designers & pubs. */
const WRITING_SOURCES: FeedSource[] = WRITER_FEEDS.map((feed) => ({
  id: feed.id,
  name: feed.name,
  feedUrl: feed.feedUrl,
  platform: platformForWriter(feed.id),
  defaultType: feed.defaultType,
  siteUrl: feed.siteUrl,
  description: feed.description,
  writing: true,
}));

/**
 * Non-writing sources.
 * Visual product/UI ingest prefers Spotted + recent.design via `npm run ingest:visuals`
 * (no Behance / Awwwards firehose on the Visuals tab).
 */
const OTHER_SOURCES: FeedSource[] = [
  {
    id: "awwwards",
    name: "Awwwards Blog",
    feedUrl: "https://www.awwwards.com/blog/feed/",
    platform: "awwwards",
    defaultType: "article",
    siteUrl: "https://www.awwwards.com/blog/",
    description: "Web design awards & craft notes",
    writing: true,
  },
  {
    id: "dezeen",
    name: "Dezeen",
    feedUrl: "https://www.dezeen.com/feed/",
    platform: "dezeen",
    defaultType: "news",
    siteUrl: "https://www.dezeen.com",
    description: "Architecture & design news (selective)",
  },
  {
    id: "designboom",
    name: "designboom",
    feedUrl: "https://www.designboom.com/feed/",
    platform: "web",
    defaultType: "news",
    siteUrl: "https://www.designboom.com",
    description: "Art & design news (selective)",
  },
  {
    id: "sidebar",
    name: "Sidebar",
    feedUrl: "https://sidebar.io/feed.xml",
    platform: "web",
    defaultType: "news",
    siteUrl: "https://sidebar.io",
    description: "Daily design links (cap hard)",
  },
];

/**
 * Curated RSS sources — writing first, then visuals & selective news.
 */
export const FEED_SOURCES: FeedSource[] = [
  ...WRITING_SOURCES,
  ...OTHER_SOURCES.filter(
    (source) => !WRITING_SOURCES.some((writing) => writing.id === source.id)
  ),
];

export function getFeedSource(id: string) {
  return FEED_SOURCES.find((source) => source.id === id) ?? null;
}

export function getWritingSources() {
  return FEED_SOURCES.filter((source) => source.writing);
}
