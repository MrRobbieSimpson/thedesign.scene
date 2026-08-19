"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export function PublishedBanner({
  portfolioHandle,
  needsBio,
}: {
  portfolioHandle: string | null;
  needsBio?: boolean;
}) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="mb-10 rounded-2xl border border-border/50 bg-muted/20 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="font-heading text-base tracking-tight">Published</p>
          <p className="text-sm text-muted-foreground">
            It’s live on the feed
            {portfolioHandle ? (
              <>
                {" "}
                and on your{" "}
                <Link
                  href={`/u/${portfolioHandle}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  portfolio
                </Link>
              </>
            ) : null}
            .
          </p>
          {needsBio && portfolioHandle ? (
            <p className="pt-1 text-sm text-muted-foreground">
              One more step —{" "}
              <Link
                href="/settings/profile"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                add a short bio
              </Link>{" "}
              so readers know who’s writing.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
