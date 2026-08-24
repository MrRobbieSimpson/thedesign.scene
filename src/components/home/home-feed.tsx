"use client";

import { useEffect, useMemo, useState } from "react";

import { ContentCard } from "@/components/content/content-card";
import { FeedEventCard } from "@/components/content/feed-event-card";
import {
  FEED_LAYOUT_STORAGE_KEY,
  isFeedLayout,
  type FeedLayout,
} from "@/components/content/feed-layout";
import { FeedToolbar } from "@/components/content/feed-toolbar";
import { DigestStrip } from "@/components/home/digest-strip";
import type { Event } from "@/db/schema";
import type { ContentWithMaker } from "@/lib/demo-data";
import type { FeedItem } from "@/lib/feed-mix";
import { cn } from "@/lib/utils";

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

function densityFor(layout: FeedLayout) {
  if (layout === "small") return "compact" as const;
  if (layout === "mosaic") return "mosaic" as const;
  return "comfortable" as const;
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

function FeedGrid({
  items,
  layout,
}: {
  items: FeedItem[];
  layout: FeedLayout;
}) {
  if (items.length === 0) return null;
  const density = densityFor(layout);

  // Mosaic: single column on phones (2-col was leaving a half-empty screen).
  if (layout === "mosaic") {
    return (
      <div className="columns-1 gap-3 sm:columns-2 sm:gap-5 md:columns-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="mb-3 w-full break-inside-avoid sm:mb-5"
          >
            <FeedItemCard item={item} density={density} priority={index < 3} />
          </div>
        ))}
      </div>
    );
  }

  // Small: dense 2-up; min-w-0 prevents grid blowout on narrow screens.
  if (layout === "small") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {items.map((item, index) => (
          <div key={item.id} className="min-w-0 w-full">
            <FeedItemCard
              item={item}
              density={density}
              priority={index < 6}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-10 sm:gap-14">
      {items.map((item, index) => (
        <div key={item.id} className="w-full min-w-0">
          <FeedItemCard
            item={item}
            density={density}
            priority={index < 4}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Home feed with Digest callout inserted about halfway through the selection.
 */
export function HomeFeed({
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
    if (stored && isFeedLayout(stored)) setLayout(stored);
  }, []);

  function onLayoutChange(next: FeedLayout) {
    setLayout(next);
    window.localStorage.setItem(FEED_LAYOUT_STORAGE_KEY, next);
  }

  const mid = Math.max(1, Math.ceil(revived.length / 2));
  const first = revived.slice(0, mid);
  const second = revived.slice(mid);

  return (
    <div className="space-y-8 sm:space-y-10">
      <FeedToolbar
        toolbar={toolbar}
        layout={layout}
        onLayoutChange={onLayoutChange}
        count={revived.length}
      />

      {revived.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 px-6 py-24 text-center">
          <p className="font-heading text-2xl tracking-tight">
            Nothing selected yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Editor’s picks, writing, visuals, and events will appear here.
          </p>
        </div>
      ) : (
        <>
          <FeedGrid items={first} layout={layout} />
          <div className={cn(layout === "big" ? "py-2 sm:py-4" : "py-1")}>
            <DigestStrip />
          </div>
          {second.length > 0 ? (
            <FeedGrid items={second} layout={layout} />
          ) : null}
        </>
      )}
    </div>
  );
}
