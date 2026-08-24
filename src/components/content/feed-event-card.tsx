import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Event } from "@/db/schema";
import { eventTypeLabel, formatEventRange } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Elevated event presence in the main feed — calendar-forward, not news-like.
 */
export function FeedEventCard({
  event,
  density = "comfortable",
}: {
  event: Event;
  density?: "comfortable" | "compact" | "mosaic";
}) {
  const compact = density === "compact";
  const mosaic = density === "mosaic";

  const inner = (
    <article
      className={cn(
        "event-ticket group relative flex h-full w-full min-w-0 flex-col justify-between rounded-2xl border border-foreground/10 bg-gradient-to-br from-card via-card to-muted/40 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        compact ? "py-4 pr-4 pl-9" : "py-5 pr-5 pl-9 sm:py-7 sm:pr-7 sm:pl-11",
        !mosaic &&
          "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_18px_50px_-28px_rgba(0,0,0,0.45)] active:translate-y-0 active:scale-[0.985]",
        mosaic && "hover:border-foreground/20"
      )}
    >
      <span aria-hidden className="event-ticket-stub" />

      <div className={cn("relative", compact ? "space-y-3" : "space-y-5")}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="gap-1.5 border-0 bg-foreground text-background">
            <CalendarDays className="size-3.5" />
            Event
          </Badge>
          <Badge variant="outline">{eventTypeLabel(event.type)}</Badge>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium tracking-tight text-muted-foreground">
            {formatEventRange(event.startDate, event.endDate)}
          </p>
          <h3
            className={cn(
              "font-heading text-balance tracking-tight",
              compact ? "text-base leading-snug" : "text-2xl leading-[1.2]"
            )}
          >
            {event.title}
          </h3>
          {event.description && !compact ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "relative flex items-center justify-between gap-3 text-sm text-muted-foreground",
          compact ? "mt-4" : "mt-8"
        )}
      >
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{event.location ?? "Location TBA"}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-medium transition-colors group-hover:text-foreground">
          Details
          <ArrowUpRight className="size-3.5" />
        </span>
      </div>
    </article>
  );

  if (event.url) {
    return (
      <Link href={event.url} target="_blank" rel="noreferrer">
        {inner}
      </Link>
    );
  }

  return (
    <Link href="/events" className="block">
      {inner}
    </Link>
  );
}
