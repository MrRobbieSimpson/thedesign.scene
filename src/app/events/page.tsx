import { EventsExplorer } from "@/components/events/events-explorer";
import { getPublishedEvents } from "@/lib/queries";

export const revalidate = 60;

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
          Talks, meetups, and conferences — curated with the same taste as the
          feed. Use Find near me to sort by distance (we only ask when you tap).
        </p>
      </section>

      <EventsExplorer events={events} />
    </div>
  );
}
