import { Suspense } from "react";

import { FeedExplorer } from "@/components/content/feed-explorer";
import { FeedFilters } from "@/components/content/feed-filters";
import { GuestEditorStrip } from "@/components/home/guest-editor-strip";
import { LiveFromX } from "@/components/home/live-from-x";
import {
  filterFeedItems,
  isFeedFilter,
  pickLiveFromX,
  type FeedFilter,
} from "@/lib/feed-mix";
import {
  getCurrentGuestEditor,
  getPublishedContentPool,
  getPublishedEvents,
  getRegisteredDesignerCount,
} from "@/lib/queries";

/** Soft ISR — feed stays fresh without a Neon hit on every request. */
export const revalidate = 60;

type HomeProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams;
  const rawType = params.type ?? "all";
  const filter: FeedFilter = isFeedFilter(rawType) ? rawType : "all";

  const [content, events, designers, guest] = await Promise.all([
    getPublishedContentPool(),
    getPublishedEvents(),
    getRegisteredDesignerCount(),
    getCurrentGuestEditor(),
  ]);

  const items = filterFeedItems(filter, content, events);
  const liveFromX = filter === "all" ? pickLiveFromX(content, 4) : [];

  const editorialCount = items.filter(
    (item) =>
      item.kind === "content" &&
      (item.item.type === "article" || item.item.type === "thought")
  ).length;

  const featuredCount = items.filter(
    (item) => item.kind === "content" && item.item.featured
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
      <section className="mb-14 max-w-2xl space-y-5 sm:mb-16">
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">
          Editor’s selection
        </p>
        <h1 className="font-heading text-4xl tracking-tight text-balance sm:text-5xl">
          Design worth sitting with.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          A small, considered mix — writing first, then visuals and events.
          Not a firehose. Quality over quantity.
        </p>
        <p className="text-sm text-muted-foreground/80">
          <span className="font-medium tabular-nums text-foreground/90">
            {designers.toLocaleString()}
          </span>{" "}
          {designers === 1 ? "designer" : "designers"} registered
          {filter === "all" ? (
            <>
              {" "}
              · {items.length} selected
              {featuredCount > 0 ? (
                <>
                  {" "}
                  · {featuredCount} editor{" "}
                  {featuredCount === 1 ? "pick" : "picks"}
                </>
              ) : null}{" "}
              · {editorialCount} editorial
            </>
          ) : null}
        </p>
      </section>

      {guest ? <GuestEditorStrip guest={guest} /> : null}

      <FeedExplorer
        key={filter}
        items={items}
        toolbar={
          <Suspense
            fallback={
              <div className="h-10 w-72 animate-pulse rounded-full bg-muted" />
            }
          >
            <FeedFilters />
          </Suspense>
        }
      />

      {liveFromX.length > 0 ? <LiveFromX items={liveFromX} /> : null}
    </div>
  );
}
