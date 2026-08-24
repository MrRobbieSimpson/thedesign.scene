"use client";

import { useEffect, useMemo, useState } from "react";

import { ContentCard } from "@/components/content/content-card";
import { FeedEventCard } from "@/components/content/feed-event-card";
import {
  FEED_LAYOUT_STORAGE_KEY,
  isFeedLayout,
  type FeedLayout,
} from "@/components/content/feed-layout";
import { FeedLayoutGrid } from "@/components/content/feed-layout-grid";
import { resolveFeedLayout } from "@/components/content/feed-layout-switcher";
import { FeedToolbar } from "@/components/content/feed-toolbar";
import type { Event } from "@/db/schema";
import type { ContentWithMaker } from "@/lib/demo-data";
import type { FeedItem } from "@/lib/feed-mix";
import { useIsSmUp } from "@/lib/use-media-query";

function reviveContent(item: ContentWithMaker): ContentWithMaker {
  return {
    ...item,
    publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

function reviveEvent(event: Event): Event {
  return {
    ...event,
    startDate: new Date(event.startDate),
    endDate: event.endDate ? new Date(event.endDate) : null,
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt),
  };
}

function reviveFeedItem(item: FeedItem): FeedItem {
  if (item.kind === "event") {
    return { ...item, item: reviveEvent(item.item) };
  }
  return { ...item, item: reviveContent(item.item) };
}

export function FeedExplorer({
  items,
  toolbar,
  showControls = true,
  className,
}: {
  items: FeedItem[];
  toolbar?: React.ReactNode;
  /** When false, only renders the grid (for mid-page continuations). */
  showControls?: boolean;
  className?: string;
}) {
  const [layout, setLayout] = useState<FeedLayout>("big");
  const smUp = useIsSmUp();
  const effectiveLayout = resolveFeedLayout(layout, smUp);
  const revived = useMemo(() => items.map(reviveFeedItem), [items]);

  useEffect(() => {
    const stored = window.localStorage.getItem(FEED_LAYOUT_STORAGE_KEY);
    if (stored && isFeedLayout(stored)) {
      setLayout(stored);
    }
  }, []);

  function onLayoutChange(next: FeedLayout) {
    setLayout(next);
    window.localStorage.setItem(FEED_LAYOUT_STORAGE_KEY, next);
  }

  // Re-read layout when continuing mid-page so both halves stay in sync.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== FEED_LAYOUT_STORAGE_KEY || !event.newValue) return;
      if (isFeedLayout(event.newValue)) setLayout(event.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const listKey = `${effectiveLayout}:${revived.map((item) => item.id).join("|")}`;

  return (
    <div className={className ?? "space-y-8 sm:space-y-10"}>
      {showControls ? (
        <FeedToolbar
          toolbar={toolbar}
          layout={layout}
          onLayoutChange={onLayoutChange}
          count={revived.length}
        />
      ) : null}

      <FeedGridLayout
        key={listKey}
        items={revived}
        layout={effectiveLayout}
      />
    </div>
  );
}

function densityFor(layout: FeedLayout) {
  if (layout === "small") return "compact" as const;
  if (layout === "mosaic") return "mosaic" as const;
  return "comfortable" as const;
}

function FeedGridLayout({
  items,
  layout,
}: {
  items: FeedItem[];
  layout: FeedLayout;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 px-6 py-24 text-center">
        <p className="font-heading text-2xl tracking-tight">
          Nothing selected yet
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Editor’s picks, writing, visuals, and events will appear here.
        </p>
      </div>
    );
  }

  const density = densityFor(layout);
  const priorityCap = layout === "big" ? 4 : layout === "small" ? 6 : 3;

  return (
    <FeedLayoutGrid layout={layout}>
      {items.map((item, index) => (
        <FeedItemCard
          key={item.id}
          item={item}
          density={density}
          priority={index < priorityCap}
        />
      ))}
    </FeedLayoutGrid>
  );
}

function FeedItemCard({
  item,
  density,
  priority,
}: {
  item: FeedItem;
  density: "comfortable" | "compact" | "mosaic";
  priority?: boolean;
}) {
  if (item.kind === "event") {
    return <FeedEventCard event={item.item} density={density} />;
  }
  return (
    <ContentCard item={item.item} density={density} priority={priority} />
  );
}
