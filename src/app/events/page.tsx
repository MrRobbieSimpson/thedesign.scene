import Link from "next/link";

import { EventsExplorer } from "@/components/events/events-explorer";
import { isUpcomingEvent } from "@/lib/feed-mix";
import { getPublishedEvents } from "@/lib/queries";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Events",
  path: "/events",
  description:
    "Design events worth showing up for — talks, meetups, and conferences, curated with the same taste as the feed.",
});

export default async function EventsPage() {
  const events = await getPublishedEvents();
  const upcoming = events
    .filter((event) => isUpcomingEvent(event))
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  return (
    <div className="mx-auto max-w-[45rem] px-5 py-14 sm:px-6 sm:py-20">
      <section className="mb-12 space-y-4">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Calendar
        </p>
        <h1 className="font-heading text-4xl tracking-tight text-balance sm:text-5xl">
          Design events worth showing up for.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Talks, meetups, and conferences — curated with the same taste as the
          writing. In person, hybrid, or remote. Enter a city to sort by what’s
          close — no account needed.
        </p>
        <p className="text-sm text-muted-foreground/80">
          {upcoming.length === 0
            ? "Nothing upcoming right now"
            : `${upcoming.length} upcoming`}{" "}
          · also surfaced in the{" "}
          <Link href="/?type=events" className="underline underline-offset-4">
            feed
          </Link>
        </p>
      </section>

      <EventsExplorer events={upcoming} />
    </div>
  );
}
