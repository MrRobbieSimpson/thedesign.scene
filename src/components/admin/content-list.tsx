"use client";

import Link from "next/link";
import { useTransition } from "react";

import {
  approveFeatureBoost,
  rejectFeatureBoost,
  setContentStatus,
} from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ContentWithMaker } from "@/lib/demo-data";
import { contentTypeLabel, formatPublishedDate } from "@/lib/format";

export function ContentList({
  items,
  disabled,
}: {
  items: ContentWithMaker[];
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function toggle(id: string, next: "draft" | "published") {
    startTransition(async () => {
      await setContentStatus(id, next);
    });
  }

  function approveFeature(id: string) {
    startTransition(async () => {
      await approveFeatureBoost(id);
    });
  }

  function rejectFeature(id: string) {
    startTransition(async () => {
      await rejectFeatureBoost(id);
    });
  }

  const sorted = [...items].sort((a, b) => {
    const aBoost = a.featureBoostStatus === "pending_review" ? 0 : 1;
    const bBoost = b.featureBoostStatus === "pending_review" ? 0 : 1;
    if (aBoost !== bBoost) return aBoost - bBoost;
    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 px-6 py-12 text-center text-sm text-muted-foreground">
        No content yet. Create your first piece above.
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
                  {contentTypeLabel(item.type)}
                </Badge>
                <Badge
                  variant={item.status === "published" ? "default" : "outline"}
                >
                  {item.status}
                </Badge>
                {item.featured ? (
                  <Badge variant="outline">Featured</Badge>
                ) : null}
                {item.featureBoostStatus === "pending_review" ? (
                  <Badge variant="default">feature $10</Badge>
                ) : null}
              </div>
              <Link
                href={`/content/${item.id}`}
                className="block truncate font-medium transition-colors hover:text-muted-foreground"
              >
                {item.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {item.maker ? `@${item.maker.handle}` : "No maker"}
                {item.publishedAt
                  ? ` · ${formatPublishedDate(item.publishedAt)}`
                  : " · Not published"}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {item.featureBoostStatus === "pending_review" ? (
                <>
                  <Button
                    size="sm"
                    disabled={disabled || pending}
                    onClick={() => approveFeature(item.id)}
                  >
                    Feature
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || pending}
                    onClick={() => rejectFeature(item.id)}
                  >
                    Dismiss
                  </Button>
                </>
              ) : null}
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
