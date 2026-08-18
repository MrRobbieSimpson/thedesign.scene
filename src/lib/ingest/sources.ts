import type { ContentType } from "@/db/schema";
import type { SourcePlatform } from "@/lib/ingest/types";

export type FeedSource = {
  id: string;
  name: string;
  feedUrl: string;
  platform: SourcePlatform;
  defaultType: ContentType;
  siteUrl: string;
  description?: string;
};

/**
 * Curated RSS sources for /admin → Browse RSS.
 * Anything else (Behance, Layers, Siteinspire, Spottedinprod, X…) —
 * paste the URL into Import URL (Open Graph / oEmbed).
 */
export const FEED_SOURCES: FeedSource[] = [
  {
    id: "handheld",
    name: "Handheld",
    feedUrl: "https://www.handheld.design/feed",
    platform: "handheld",
    defaultType: "news",
    siteUrl: "https://www.handheld.design",
    description: "Mobile craft & ranked design picks",
  },
  {
    id: "dezeen",
    name: "Dezeen",
    feedUrl: "https://www.dezeen.com/feed/",
    platform: "dezeen",
    defaultType: "news",
    siteUrl: "https://www.dezeen.com",
    description: "Architecture & design news",
  },
  {
    id: "dribbble-stories",
    name: "Dribbble Stories",
    feedUrl: "https://dribbble.com/stories.rss",
    platform: "dribbble",
    defaultType: "news",
    siteUrl: "https://dribbble.com/stories",
    description: "Editorial from the Dribbble community",
  },
  {
    id: "awwwards",
    name: "Awwwards Blog",
    feedUrl: "https://www.awwwards.com/blog/feed/",
    platform: "awwwards",
    defaultType: "news",
    siteUrl: "https://www.awwwards.com/blog/",
    description: "Web design awards & inspiration",
  },
  {
    id: "smashing",
    name: "Smashing Magazine",
    feedUrl: "https://www.smashingmagazine.com/feed/",
    platform: "smashing",
    defaultType: "news",
    siteUrl: "https://www.smashingmagazine.com",
    description: "Design & front-end articles",
  },
  {
    id: "medium-product-design",
    name: "Medium · Product Design",
    feedUrl: "https://medium.com/feed/tag/product-design",
    platform: "medium",
    defaultType: "news",
    siteUrl: "https://medium.com/tag/product-design",
    description: "Tagged product-design writing",
  },
];

export function getFeedSource(id: string) {
  return FEED_SOURCES.find((source) => source.id === id) ?? null;
}
