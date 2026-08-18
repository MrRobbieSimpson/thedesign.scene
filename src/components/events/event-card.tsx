import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Event } from "@/db/schema";
import { eventTypeLabel, formatEventRange } from "@/lib/format";

export function EventCard({ event }: { event: Event }) {
  const content = (
    <article className="group flex h-full flex-col justify-between gap-6 rounded-2xl border border-border/70 bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{eventTypeLabel(event.type)}</Badge>
          <span className="text-sm text-muted-foreground">
            {formatEventRange(event.startDate, event.endDate)}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="font-heading text-2xl leading-snug tracking-tight">
            {event.title}
          </h3>
          {event.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          {event.location ?? "TBA"}
        </span>
        {event.url ? (
          <span className="inline-flex items-center gap-1 font-medium transition-colors group-hover:text-foreground">
            Details
            <ArrowUpRight className="size-3.5" />
          </span>
        ) : null}
      </div>
    </article>
  );

  if (event.url) {
    return (
      <Link href={event.url} target="_blank" rel="noreferrer">
        {content}
      </Link>
    );
  }

  return content;
}
