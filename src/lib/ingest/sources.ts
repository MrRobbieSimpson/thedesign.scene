import type { ContentType } from "@/db/schema";
import type { SourcePlatform } from "@/lib/ingest/types";

export type FeedSource = {
  id: string;
  name: string;
  feedUrl: string;
  platform: SourcePlatform;
  defaultType: ContentType;
  siteUrl: string;
};

export const FEED_SOURCES: FeedSource[] = [
  {
    id: "handheld",
    name: "Handheld",
    feedUrl: "https://www.handheld.design/feed",
    platform: "handheld",
    defaultType: "news",
    siteUrl: "https://www.handheld.design",
  },
  {
    id: "dezeen",
    name: "Dezeen",
    feedUrl: "https://www.dezeen.com/feed/",
    platform: "dezeen",
    defaultType: "news",
    siteUrl: "https://www.dezeen.com",
  },
];

export function getFeedSource(id: string) {
  return FEED_SOURCES.find((source) => source.id === id) ?? null;
}
