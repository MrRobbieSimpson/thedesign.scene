import { Suspense } from "react";

import { FeedExplorer } from "@/components/content/feed-explorer";
import { FeedFilters } from "@/components/content/feed-filters";
import { filterFeedItems, isFeedFilter, type FeedFilter } from "@/lib/feed-mix";
import {
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

  const [content, events, designers] = await Promise.all([
    getPublishedContentPool(),
    getPublishedEvents(),
    getRegisteredDesignerCount(),
  ]);

  const items = filterFeedItems(filter, content, events);

  const editorialCount = items.filter(
    (item) =>
      item.kind === "content" &&
      (item.item.type === "article" || item.item.type === "thought")
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <section className="mb-12 max-w-2xl space-y-4">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Curated feed
        </p>
        <h1 className="font-heading text-4xl tracking-tight text-balance sm:text-5xl">
          Design worth sitting with.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Writing first — then visuals, builds, and events worth showing up for.
          News stays selective. Quality over quantity.
        </p>
        <p className="text-sm text-muted-foreground/80">
          <span className="font-medium tabular-nums text-foreground/90">
            {designers.toLocaleString()}
          </span>{" "}
          {designers === 1 ? "designer" : "designers"} registered
          {filter === "all" ? (
            <>
              {" "}
              · {editorialCount} editorial{" "}
              {editorialCount === 1 ? "piece" : "pieces"} in this mix
            </>
          ) : null}
        </p>
      </section>

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
    </div>
  );
}
