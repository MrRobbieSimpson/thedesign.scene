"use client";

import { useMemo } from "react";

import { ContentCard } from "@/components/content/content-card";
import { FeedEventCard } from "@/components/content/feed-event-card";
import type { FeedLayout } from "@/components/content/feed-layout";
import { useFeedLayout } from "@/components/content/feed-layout-context";
import { FeedLayoutGrid } from "@/components/content/feed-layout-grid";
import { resolveFeedLayout } from "@/components/content/feed-layout-switcher";
import { FeedToolbar } from "@/components/content/feed-toolbar";
import { DesignersStrip } from "@/components/home/designers-strip";
import { DigestStrip } from "@/components/home/digest-strip";
import { JobsStrip } from "@/components/home/jobs-strip";
import type { Event, Job } from "@/db/schema";
import type { ContentWithMaker } from "@/lib/demo-data";
import type { FeedFilter, FeedItem } from "@/lib/feed-mix";
import { useIsSmUp } from "@/lib/use-media-query";
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
  dense,
}: {
  items: FeedItem[];
  layout: FeedLayout;
  dense?: boolean;
}) {
  if (items.length === 0) return null;
  const density = densityFor(layout);
  const priorityCap = layout === "big" ? 4 : layout === "small" ? 6 : 6;

  return (
    <FeedLayoutGrid layout={layout} dense={dense}>
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

/**
 * Home feed with Digest callout inserted about halfway through the selection.
 * Visuals tab: forced dense mosaic, no mid-feed strips (recent.design feel).
 */
export function HomeFeed({
  items,
  filter = "articles",
  toolbar,
  featuredJob = null,
  designerWriting = [],
}: {
  items: FeedItem[];
  filter?: FeedFilter;
  toolbar?: React.ReactNode;
  /** Latest curated opening — quiet mid-feed callout when present. */
  featuredJob?: Job | null;
  /** Community articles for the From designers strip. */
  designerWriting?: ContentWithMaker[];
}) {
  const visualsMode = filter === "visuals";
  const articlesMode = filter === "articles";
  const { layout, setLayout } = useFeedLayout();
  const smUp = useIsSmUp();
  const effectiveLayout = visualsMode
    ? "mosaic"
    : resolveFeedLayout(layout, smUp);
  const revived = useMemo(() => items.map(reviveFeedItem), [items]);

  function onLayoutChange(next: FeedLayout) {
    if (visualsMode) return;
    setLayout(next);
  }

  const mid = Math.max(1, Math.ceil(revived.length / 2));
  const first = revived.slice(0, mid);
  const second = revived.slice(mid);
  /** Mid-strips only in the linear “big” layout — splitting mosaic/small breaks the grid. */
  const showMidStrips = articlesMode && effectiveLayout === "big";

  return (
    <div className="w-full min-w-0 space-y-5 overflow-x-hidden sm:space-y-10">
      <FeedToolbar
        toolbar={toolbar}
        layout={effectiveLayout}
        onLayoutChange={onLayoutChange}
        count={revived.length}
        hideLayoutSwitcher={visualsMode}
      />

      {revived.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 px-6 py-24 text-center">
          <p className="font-heading text-2xl tracking-tight">
            Nothing selected yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {visualsMode
              ? "Published product & UI visuals will appear here."
              : filter === "events"
                ? "Upcoming events will appear here."
                : "Writing and editor’s picks will appear here."}
          </p>
        </div>
      ) : visualsMode ? (
        <FeedGrid items={revived} layout="mosaic" dense />
      ) : showMidStrips ? (
        <>
          <FeedGrid items={first} layout={effectiveLayout} />
          <div className="space-y-4 py-2 sm:py-4">
            <DigestStrip />
            <DesignersStrip items={designerWriting} />
            {featuredJob ? <JobsStrip job={featuredJob} /> : null}
          </div>
          {second.length > 0 ? (
            <FeedGrid items={second} layout={effectiveLayout} />
          ) : null}
        </>
      ) : (
        <FeedGrid items={revived} layout={effectiveLayout} />
      )}
    </div>
  );
}
