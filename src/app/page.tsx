import { Suspense } from "react";

import { FeedFilters } from "@/components/content/feed-filters";
import { GuestEditorStrip } from "@/components/home/guest-editor-strip";
import { HomeFeed } from "@/components/home/home-feed";
import {
  filterFeedItems,
  pickDesignerWriting,
  resolveFeedFilter,
  type FeedFilter,
} from "@/lib/feed-mix";
import {
  getCurrentGuestEditor,
  getPublishedContentPool,
  getPublishedEvents,
  getPublishedJobs,
  getRegisteredDesignerCount,
} from "@/lib/queries";
import { buildPageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

/** Soft ISR — feed stays fresh without a Neon hit on every request. */
export const revalidate = 60;

export const metadata = buildPageMetadata({
  path: "/",
  description:
    "A calm curation of design writing, with visuals and events on the side — quality over quantity.",
});

type HomeProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams;
  const filter: FeedFilter = resolveFeedFilter(params.type);
  const visualsMode = filter === "visuals";
  const articlesMode = filter === "articles";

  const [content, events, openJobs, designers, guest] = await Promise.all([
    getPublishedContentPool(),
    getPublishedEvents(),
    getPublishedJobs(),
    getRegisteredDesignerCount(),
    getCurrentGuestEditor(),
  ]);

  const items = filterFeedItems(filter, content, events);
  const designerWriting = articlesMode
    ? pickDesignerWriting(content, 3)
    : [];
  const featuredJob = articlesMode ? openJobs[0] ?? null : null;

  const editorialCount = items.filter(
    (item) =>
      item.kind === "content" &&
      (item.item.type === "article" || item.item.type === "thought")
  ).length;

  const featuredCount = items.filter(
    (item) => item.kind === "content" && item.item.featured
  ).length;

  return (
    <div
      className={cn(
        "mx-auto px-5 py-14 sm:px-6 sm:py-20",
        visualsMode ? "max-w-7xl" : "max-w-[45rem]"
      )}
    >
      <section
        className={cn(
          "space-y-5",
          visualsMode ? "mb-10 sm:mb-12" : "mb-14 sm:mb-16"
        )}
      >
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">
          {visualsMode
            ? "Visuals"
            : filter === "events"
              ? "Events"
              : "Writing"}
        </p>
        <h1
          className={cn(
            "font-heading tracking-tight text-balance",
            visualsMode ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"
          )}
        >
          {visualsMode
            ? "Product & UI worth looking at."
            : filter === "events"
              ? "Design gatherings worth showing up for."
              : "Design worth sitting with."}
        </h1>
        <p
          className={cn(
            "leading-relaxed text-muted-foreground",
            visualsMode
              ? "max-w-xl text-sm sm:text-base"
              : "text-base sm:text-lg"
          )}
        >
          {visualsMode
            ? "High-bar product and interface craft — not a Behance firehose."
            : filter === "events"
              ? "Upcoming design events, nearby and elsewhere."
              : "Essays and notes from designers and craft pubs. Writing first — visuals and events are next door."}
        </p>
        {articlesMode ? (
          <p className="text-sm text-muted-foreground/80">
            {designers > 30 ? (
              <>
                <span className="font-medium tabular-nums text-foreground/90">
                  {designers.toLocaleString()}
                </span>{" "}
                designers registered
                {" · "}
              </>
            ) : null}
            {items.length} selected
            {featuredCount > 0 ? (
              <>
                {" "}
                · {featuredCount} editor{" "}
                {featuredCount === 1 ? "pick" : "picks"}
              </>
            ) : null}{" "}
            · {editorialCount} editorial
          </p>
        ) : null}
      </section>

      {articlesMode && guest ? <GuestEditorStrip guest={guest} /> : null}

      <HomeFeed
        items={items}
        filter={filter}
        featuredJob={featuredJob}
        designerWriting={designerWriting}
        toolbar={
          <Suspense
            fallback={
              <div className="h-10 w-72 max-w-full animate-pulse rounded-full bg-muted" />
            }
          >
            <FeedFilters />
          </Suspense>
        }
      />
    </div>
  );
}
