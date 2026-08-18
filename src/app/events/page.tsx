import { EventCard } from "@/components/events/event-card";
import { getPublishedEvents } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Events",
  description: "Design events — in person, hybrid, and remote.",
};

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <section className="mb-12 max-w-2xl space-y-4">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Calendar
        </p>
        <h1 className="font-heading text-4xl tracking-tight text-balance sm:text-5xl">
          Design events worth showing up for.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Talks, meetups, and studio hours — curated with the same taste as the
          feed.
        </p>
      </section>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 px-6 py-20 text-center">
          <p className="font-heading text-2xl tracking-tight">No events yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Published events will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
