"use client";

import Link from "next/link";
import { useTransition } from "react";

import { setJobStatus } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Job, JobStatus } from "@/db/schema";
import { jobWorkModeLabel } from "@/lib/format";

function statusLabel(status: JobStatus) {
  switch (status) {
    case "pending_payment":
      return "awaiting payment";
    case "pending_review":
      return "pending review";
    default:
      return status;
  }
}

function statusPriority(status: JobStatus) {
  switch (status) {
    case "pending_review":
      return 0;
    case "pending_payment":
      return 1;
    case "draft":
      return 2;
    case "published":
      return 3;
    case "closed":
      return 4;
    default:
      return 5;
  }
}

export function JobList({
  items,
  disabled,
}: {
  items: Job[];
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function setStatus(id: string, next: JobStatus) {
    startTransition(async () => {
      await setJobStatus(id, next);
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
        No openings yet. Add a role above when you’d recommend it to a friend —
        or wait for a paid company submission.
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
                <Badge variant="secondary">
                  {jobWorkModeLabel(item.workMode)}
                </Badge>
                <Badge
                  variant={
                    item.status === "published"
                      ? "default"
                      : item.status === "pending_review"
                        ? "default"
                        : "outline"
                  }
                >
                  {statusLabel(item.status)}
                </Badge>
                {item.source === "paid" ? (
                  <Badge variant="outline">
                    {item.paidAt ? "paid $70" : "paid path"}
                  </Badge>
                ) : null}
                {item.roleKind ? (
                  <Badge variant="outline">{item.roleKind}</Badge>
                ) : null}
              </div>
              <p className="truncate font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.company}
                {item.location ? ` · ${item.location}` : ""}
                {item.contactEmail ? ` · ${item.contactEmail}` : ""}
                {!item.editorNote && item.status !== "pending_payment"
                  ? " · missing note"
                  : ""}
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
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || pending}
                    onClick={() => setStatus(item.id, "draft")}
                  >
                    Unpublish
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || pending}
                    onClick={() => setStatus(item.id, "closed")}
                  >
                    Close
                  </Button>
                </>
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
                    onClick={() => setStatus(item.id, "closed")}
                  >
                    Reject
                  </Button>
                </>
              ) : item.status === "pending_payment" ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled || pending}
                  onClick={() => setStatus(item.id, "closed")}
                >
                  Discard
                </Button>
              ) : item.status === "closed" ? (
                <Button
                  size="sm"
                  disabled={disabled || pending}
                  onClick={() => setStatus(item.id, "published")}
                >
                  Reopen
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
