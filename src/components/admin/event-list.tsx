"use client";

import Link from "next/link";
import { useTransition } from "react";

import { setEventStatus } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Event } from "@/db/schema";
import { eventTypeLabel, formatEventRange } from "@/lib/format";

export function EventList({
  items,
  disabled,
}: {
  items: Event[];
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function toggle(id: string, next: "draft" | "published") {
    startTransition(async () => {
      await setEventStatus(id, next);
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 px-6 py-12 text-center text-sm text-muted-foreground">
        No events yet. Import a conference URL or create one manually.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <ul className="divide-y divide-border/70">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-4 bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{eventTypeLabel(item.type)}</Badge>
                <Badge
                  variant={item.status === "published" ? "default" : "outline"}
                >
                  {item.status}
                </Badge>
              </div>
              <p className="truncate font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatEventRange(item.startDate, item.endDate)}
                {item.location ? ` · ${item.location}` : ""}
              </p>
              {item.url ? (
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  {item.url}
                </Link>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {item.status === "published" ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled || pending}
                  onClick={() => toggle(item.id, "draft")}
                >
                  Unpublish
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={disabled || pending}
                  onClick={() => toggle(item.id, "published")}
                >
                  Publish
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
