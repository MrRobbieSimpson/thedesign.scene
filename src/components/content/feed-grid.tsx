import { FeedExplorer } from "@/components/content/feed-explorer";
import type { ContentWithMaker } from "@/lib/demo-data";

/** Shared feed surface with layout switcher (big / small / mosaic). */
export function FeedGrid({ items }: { items: ContentWithMaker[] }) {
  return <FeedExplorer items={items} />;
}
