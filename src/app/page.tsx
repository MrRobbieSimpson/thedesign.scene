import { Suspense } from "react";

import { FeedFilters } from "@/components/content/feed-filters";
import { FeedToolbar } from "@/components/content/feed-toolbar";
import { FeedViewTransition } from "@/components/content/feed-view-transition";
import { EventsExplorer } from "@/components/events/events-explorer";
import { GuestEditorStrip } from "@/components/home/guest-editor-strip";
import { HomeFeed } from "@/components/home/home-feed";
import {
  filterFeedItems,
  isUpcomingEvent,
  pickDesignerWriting,
  resolveFeedFilter,
  type FeedFilter,
} from "@/lib/feed-mix";
import {
  getCurrentGuestEditor,
  getPublishedEvents,
  getPublishedJobs,
  getPublishedVisualsPool,
  getPublishedWritingPool,
  getRegisteredDesignerCount,
} from "@/lib/queries";
import type { Event } from "@/db/schema";
import { buildPageMetadata } from "@/lib/seo";

/** Soft ISR — longer TTL; publish actions still bust cache tags. */
export const revalidate = 120;

export const metadata = buildPageMetadata({
  path: "/",
  description:
    "A calm curation of design writing, with visuals and events on the side — quality over quantity.",
});

type HomeProps = {
  searchParams: Promise<{ type?: string }>;
};

function HomeFilters() {
  return (
    <Suspense
      fallback={
        <div className="h-10 w-72 max-w-full animate-pulse rounded-full bg-muted" />
      }
    >
      <FeedFilters />
    </Suspense>
  );
}

/** Drop heavy JSON blobs before shipping events to the client. */
function slimEvent(event: Event): Event {
  return { ...event, sourcePayload: null };
}

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams;
  const filter: FeedFilter = resolveFeedFilter(params.type);
  const visualsMode = filter === "visuals";
  const articlesMode = filter === "articles";
  const eventsMode = filter === "events";

  // Fetch only what this tab needs — keeps RSC payloads small and switches fast.
  const [content, events, openJobs, designers, guest] = await Promise.all([
    eventsMode
      ? Promise.resolve([])
      : visualsMode
        ? getPublishedVisualsPool()
        : getPublishedWritingPool(),
    articlesMode ? Promise.resolve([]) : getPublishedEvents(),
    articlesMode ? getPublishedJobs() : Promise.resolve([]),
    articlesMode ? getRegisteredDesignerCount() : Promise.resolve(0),
    articlesMode ? getCurrentGuestEditor() : Promise.resolve(null),
  ]);

  const items = filterFeedItems(filter, content, events);
  const designerWriting = articlesMode
    ? pickDesignerWriting(content, 3)
    : [];
  const featuredJob = articlesMode ? openJobs[0] ?? null : null;

  const upcomingEvents = eventsMode
    ? events
        .filter((event) => isUpcomingEvent(event))
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )
        .map(slimEvent)
    : [];

  const editorialCount = items.filter(
    (item) =>
      item.kind === "content" &&
      (item.item.type === "article" || item.item.type === "thought")
  ).length;

  const featuredCount = items.filter(
    (item) => item.kind === "content" && item.item.featured
  ).length;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[45rem] px-5 py-10 sm:px-6 sm:py-20">
      {/* Stable filter row — does not remount on tab change */}
      <div className="mb-8 sm:mb-10">
        <HomeFilters />
      </div>

      <FeedViewTransition viewKey={filter}>
        <section className="mb-10 space-y-4 sm:mb-16 sm:space-y-5">
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">
            {visualsMode ? "Visuals" : eventsMode ? "Events" : "Writing"}
          </p>
          <h1 className="font-heading text-[1.85rem] tracking-tight text-balance sm:text-5xl">
            {visualsMode
              ? "Product & UI worth looking at."
              : eventsMode
                ? "Design gatherings worth showing up for."
                : "Design worth sitting with."}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {visualsMode
              ? "High-bar product and interface craft — not a Behance firehose."
              : eventsMode
                ? "Talks, meetups, and conferences. Enter a city to see what’s nearby — works signed in or out."
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

        {eventsMode ? (
          <div className="space-y-8 sm:space-y-10">
            <FeedToolbar
              count={upcomingEvents.length}
              hideLayoutSwitcher
            />
            <EventsExplorer events={upcomingEvents} />
          </div>
        ) : (
          <HomeFeed
            items={items}
            filter={filter}
            featuredJob={featuredJob}
            designerWriting={designerWriting}
          />
        )}
      </FeedViewTransition>
    </div>
  );
}
