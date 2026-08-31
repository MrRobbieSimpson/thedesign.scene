import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Monitor, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Event, EventType } from "@/db/schema";
import { eventTypeLabel, formatEventRange } from "@/lib/format";
import { cn } from "@/lib/utils";

function TypeGlyph({ type }: { type: EventType }) {
  if (type === "remote") return <Monitor className="size-3.5" />;
  if (type === "hybrid") return <Users className="size-3.5" />;
  return <MapPin className="size-3.5" />;
}

export function EventCard({
  event,
  featured = false,
  localLabel = null,
  distanceLabel = null,
}: {
  event: Event;
  featured?: boolean;
  /** e.g. “Belfast Design” — sits in the badge row, not overlaid. */
  localLabel?: string | null;
  /** e.g. “3.2 km” when near-me is active. */
  distanceLabel?: string | null;
}) {
  const content = (
    <article
      className={cn(
        "event-ticket group relative flex w-full min-w-0 flex-col justify-between gap-5 rounded-2xl border border-border/70 bg-card py-6 pr-6 pl-10 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        featured && "border-foreground/15",
        "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_16px_48px_-28px_rgba(0,0,0,0.4)] active:translate-y-0 active:scale-[0.985]"
      )}
    >
      <span aria-hidden className="event-ticket-stub" />

      <div className="relative min-w-0 space-y-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <TypeGlyph type={event.type} />
            {eventTypeLabel(event.type)}
          </Badge>
          {localLabel ? (
            <Badge variant="outline" className="border-border/80">
              {localLabel}
            </Badge>
          ) : null}
          {distanceLabel ? (
            <span className="text-[11px] font-medium text-muted-foreground">
              {distanceLabel}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {formatEventRange(event.startDate, event.endDate)}
          </span>
        </div>

        <div className="min-w-0 space-y-2">
          <h3 className="font-heading text-2xl leading-snug tracking-tight text-balance break-words">
            {event.title}
          </h3>
          {event.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{event.location ?? "Location TBA"}</span>
        </span>
        {event.url ? (
          <span className="inline-flex shrink-0 items-center gap-1 font-medium transition-colors group-hover:text-foreground">
            Details
            <ArrowUpRight className="size-3.5" />
          </span>
        ) : null}
      </div>
    </article>
  );

  if (event.url) {
    return (
      <Link href={event.url} target="_blank" rel="noreferrer" className="block">
        {content}
      </Link>
    );
  }

  return content;
}
