import { FeedExplorer } from "@/components/content/feed-explorer";
import type { ContentWithMaker } from "@/lib/demo-data";
import type { FeedItem } from "@/lib/feed-mix";

/** Shared feed surface with layout switcher (big / small / mosaic). */
export function FeedGrid({ items }: { items: ContentWithMaker[] }) {
  const feedItems: FeedItem[] = items.map((item) => ({
    kind: "content",
    id: `content:${item.id}`,
    item,
  }));
  return <FeedExplorer items={feedItems} />;
}
