import Link from "next/link";
import type { ReactNode } from "react";

import { FeedExplorer } from "@/components/content/feed-explorer";
import { Button } from "@/components/ui/button";
import type { ContentWithMaker } from "@/lib/demo-data";
import type { FeedItem } from "@/lib/feed-mix";

/** Shared feed surface with layout switcher (big / small / mosaic). */
export function FeedGrid({
  items,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  items: ContentWithMaker[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}) {
  const feedItems: FeedItem[] = items.map((item) => ({
    kind: "content",
    id: `content:${item.id}`,
    item,
  }));
  return (
    <FeedExplorer
      items={feedItems}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
    />
  );
}

/** Default empty CTA for library surfaces. */
export function BrowseFeedAction() {
  return (
    <Button
      variant="outline"
      size="sm"
      nativeButton={false}
      render={<Link href="/" />}
    >
      Browse the feed
    </Button>
  );
}
