"use client";

import Link from "next/link";
import { useTransition } from "react";

import { setEventStatus } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Event, EventStatus } from "@/db/schema";
import { eventTypeLabel, formatEventRange } from "@/lib/format";

function statusPriority(status: EventStatus) {
  switch (status) {
    case "pending_review":
      return 0;
    case "pending_payment":
      return 1;
    case "draft":
      return 2;
    case "published":
      return 3;
    default:
      return 4;
  }
}

export function EventList({
  items,
  disabled,
}: {
  items: Event[];
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function setStatus(id: string, next: EventStatus) {
    startTransition(async () => {
      await setEventStatus(id, next);
    });
  }

  const sorted = [...items].sort((a, b) => {
    const byStatus = statusPriority(a.status) - statusPriority(b.status);
    if (byStatus !== 0) return byStatus;
    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 px-6 py-12 text-center text-sm text-muted-foreground">
        No events yet. Import a conference URL or wait for a paid submission.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <ul className="divide-y divide-border/70">
        {sorted.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-4 bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{eventTypeLabel(item.type)}</Badge>
                <Badge
                  variant={
                    item.status === "published" ||
                    item.status === "pending_review"
                      ? "default"
                      : "outline"
                  }
                >
                  {item.status.replaceAll("_", " ")}
                </Badge>
                {item.source === "paid" ? (
                  <Badge variant="outline">
                    {item.paidAt ? "paid $70" : "paid path"}
                  </Badge>
                ) : null}
              </div>
              <p className="truncate font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatEventRange(item.startDate, item.endDate)}
                {item.location ? ` · ${item.location}` : ""}
                {item.contactEmail ? ` · ${item.contactEmail}` : ""}
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

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {item.status === "published" ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled || pending}
                  onClick={() => setStatus(item.id, "draft")}
                >
                  Unpublish
                </Button>
              ) : item.status === "pending_review" ? (
                <>
                  <Button
                    size="sm"
                    disabled={disabled || pending}
                    onClick={() => setStatus(item.id, "published")}
                  >
                    Publish
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || pending}
                    onClick={() => setStatus(item.id, "cancelled")}
                  >
                    Reject
                  </Button>
                </>
              ) : item.status === "pending_payment" ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled || pending}
                  onClick={() => setStatus(item.id, "cancelled")}
                >
                  Discard
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={disabled || pending}
                  onClick={() => setStatus(item.id, "published")}
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
