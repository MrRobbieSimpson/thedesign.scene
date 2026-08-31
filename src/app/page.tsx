import { Suspense } from "react";

import { FeedFilters } from "@/components/content/feed-filters";
import { GuestEditorStrip } from "@/components/home/guest-editor-strip";
import { HomeFeed } from "@/components/home/home-feed";
import { LiveFromX } from "@/components/home/live-from-x";
import {
  filterFeedItems,
  isFeedFilter,
  pickDesignerWriting,
  pickLiveFromX,
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
    "A calm curation of writing, visuals, and design events — quality over quantity.",
});

type HomeProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams;
  const rawType = params.type ?? "all";
  const filter: FeedFilter = isFeedFilter(rawType) ? rawType : "all";
  const visualsMode = filter === "visuals";

  const [content, events, openJobs, designers, guest] = await Promise.all([
    getPublishedContentPool(),
    getPublishedEvents(),
    getPublishedJobs(),
    getRegisteredDesignerCount(),
    getCurrentGuestEditor(),
  ]);

  const items = filterFeedItems(filter, content, events);
  const liveFromX = filter === "all" ? pickLiveFromX(content, 4) : [];
  const designerWriting =
    filter === "all" ? pickDesignerWriting(content, 3) : [];
  const featuredJob = openJobs[0] ?? null;

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
          {visualsMode ? "Visuals" : "Editor’s selection"}
        </p>
        <h1
          className={cn(
            "font-heading tracking-tight text-balance",
            visualsMode
              ? "text-3xl sm:text-4xl"
              : "text-4xl sm:text-5xl"
          )}
        >
          {visualsMode
            ? "Design worth looking at."
            : "Design worth sitting with."}
        </h1>
        <p
          className={cn(
            "leading-relaxed text-muted-foreground",
            visualsMode ? "max-w-xl text-sm sm:text-base" : "text-base sm:text-lg"
          )}
        >
          {visualsMode
            ? "A dense, considered grid of visual craft — image first."
            : "A small, considered mix — writing first, then visuals and events. Not a firehose. Quality over quantity."}
        </p>
        {!visualsMode && (designers > 30 || filter === "all") ? (
          <p className="text-sm text-muted-foreground/80">
            {designers > 30 ? (
              <>
                <span className="font-medium tabular-nums text-foreground/90">
                  {designers.toLocaleString()}
                </span>{" "}
                designers registered
              </>
            ) : null}
            {designers > 30 && filter === "all" ? " · " : null}
            {filter === "all" ? (
              <>
                {items.length} selected
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
        ) : null}
      </section>

      {!visualsMode && guest ? <GuestEditorStrip guest={guest} /> : null}

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

      {liveFromX.length > 0 ? <LiveFromX items={liveFromX} /> : null}
    </div>
  );
}
