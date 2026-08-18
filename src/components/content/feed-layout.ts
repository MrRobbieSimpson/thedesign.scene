export const FEED_LAYOUTS = ["big", "small", "mosaic"] as const;

export type FeedLayout = (typeof FEED_LAYOUTS)[number];

export const FEED_LAYOUT_STORAGE_KEY = "tds-feed-layout";

export function isFeedLayout(value: string): value is FeedLayout {
  return (FEED_LAYOUTS as readonly string[]).includes(value);
}
