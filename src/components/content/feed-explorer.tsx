"use client";

import { useEffect, useMemo, useState } from "react";

import { ContentCard } from "@/components/content/content-card";
import { FeedEventCard } from "@/components/content/feed-event-card";
import {
  FEED_LAYOUT_STORAGE_KEY,
  isFeedLayout,
  type FeedLayout,
} from "@/components/content/feed-layout";
import { FeedLayoutSwitcher } from "@/components/content/feed-layout-switcher";
import type { Event } from "@/db/schema";
import type { ContentWithMaker } from "@/lib/demo-data";
import type { FeedItem } from "@/lib/feed-mix";

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
}: {
  items: FeedItem[];
  toolbar?: React.ReactNode;
}) {
  const [layout, setLayout] = useState<FeedLayout>("big");
  const revived = useMemo(() => items.map(reviveFeedItem), [items]);

  useEffect(() => {
    const stored = window.localStorage.getItem(FEED_LAYOUT_STORAGE_KEY);
    // Prefer calm big layout for the editorial promise.
    if (stored && isFeedLayout(stored) && stored !== "mosaic") {
      setLayout(stored);
    }
  }, []);

  function onLayoutChange(next: FeedLayout) {
    setLayout(next);
    window.localStorage.setItem(FEED_LAYOUT_STORAGE_KEY, next);
  }

  const listKey = revived.map((item) => item.id).join("|");

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-fit max-w-full shrink-0">{toolbar}</div>
        <div className="ml-auto flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {revived.length} selected
          </p>
          <FeedLayoutSwitcher value={layout} onChange={onLayoutChange} />
        </div>
      </div>

      <FeedGridLayout key={listKey} items={revived} layout={layout} />
    </div>
  );
}

function densityFor(layout: FeedLayout) {
  if (layout === "small") return "compact" as const;
  if (layout === "mosaic") return "mosaic" as const;
  return "comfortable" as const;
}

function shouldSpan(item: FeedItem, layout: FeedLayout, index: number) {
  if (layout !== "big") return false;
  if (item.kind === "event") return true;
  if (item.item.type === "article") return true;
  if (item.item.type === "thought" && (item.item.featured || index < 4)) {
    return true;
  }
  if (item.item.type === "build" && item.item.featured) return true;
  return false;
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
          Editor’s picks, writing, builds, and events will appear here.
        </p>
      </div>
    );
  }

  const density = densityFor(layout);

  if (layout === "mosaic") {
    return (
      <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
        {items.map((item, index) => (
          <div key={item.id} className="mb-6 break-inside-avoid">
            <FeedItemCard item={item} density={density} priority={index < 3} />
          </div>
        ))}
      </div>
    );
  }

  if (layout === "small") {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <FeedItemCard
            key={item.id}
            item={item}
            density={density}
            priority={index < 6}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={
            shouldSpan(item, layout, index) ? "md:col-span-2" : undefined
          }
        >
          <FeedItemCard item={item} density={density} priority={index < 4} />
        </div>
      ))}
    </div>
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
