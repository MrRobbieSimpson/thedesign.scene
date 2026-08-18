"use client";

import { useEffect, useMemo, useState } from "react";

import { ContentCard } from "@/components/content/content-card";
import {
  FEED_LAYOUT_STORAGE_KEY,
  isFeedLayout,
  type FeedLayout,
} from "@/components/content/feed-layout";
import { FeedLayoutSwitcher } from "@/components/content/feed-layout-switcher";
import type { ContentWithMaker } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

function reviveItem(item: ContentWithMaker): ContentWithMaker {
  return {
    ...item,
    publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

export function FeedExplorer({
  items,
  toolbar,
}: {
  items: ContentWithMaker[];
  toolbar?: React.ReactNode;
}) {
  const [layout, setLayout] = useState<FeedLayout>("big");
  const revived = useMemo(() => items.map(reviveItem), [items]);

  useEffect(() => {
    const stored = window.localStorage.getItem(FEED_LAYOUT_STORAGE_KEY);
    if (stored && isFeedLayout(stored)) setLayout(stored);
  }, []);

  function onLayoutChange(next: FeedLayout) {
    setLayout(next);
    window.localStorage.setItem(FEED_LAYOUT_STORAGE_KEY, next);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">{toolbar}</div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <p className="text-sm text-muted-foreground sm:order-first">
            {revived.length} {revived.length === 1 ? "piece" : "pieces"}
          </p>
          <FeedLayoutSwitcher value={layout} onChange={onLayoutChange} />
        </div>
      </div>

      <FeedGridLayout items={revived} layout={layout} />
    </div>
  );
}

function FeedGridLayout({
  items,
  layout,
}: {
  items: ContentWithMaker[];
  layout: FeedLayout;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 px-6 py-20 text-center">
        <p className="font-heading text-2xl tracking-tight">Nothing here yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Published articles, visuals, builds, news, and posts will appear here.
        </p>
      </div>
    );
  }

  if (layout === "mosaic") {
    return (
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "mb-5 break-inside-avoid",
              index % 7 === 0 && "sm:translate-y-1"
            )}
          >
            <ContentCard
              item={item}
              density="mosaic"
              priority={index < 3}
            />
          </div>
        ))}
      </div>
    );
  }

  if (layout === "small") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <ContentCard
            key={item.id}
            item={item}
            density="compact"
            priority={index < 6}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={
            (item.type === "article" ||
              item.type === "thought" ||
              item.type === "news") &&
            item.featured
              ? "md:col-span-2"
              : undefined
          }
        >
          <ContentCard
            item={item}
            density="comfortable"
            priority={index < 4}
          />
        </div>
      ))}
    </div>
  );
}
