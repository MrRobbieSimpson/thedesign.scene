"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { AnimatedPills } from "@/components/ui/animated-pills";
import {
  DEFAULT_FEED_FILTER,
  FEED_FILTERS,
  resolveFeedFilter,
  type FeedFilter,
} from "@/lib/feed-mix";

const labels: Record<FeedFilter, string> = {
  articles: "Writing",
  visuals: "Visuals",
  events: "Events",
};

/** Shorter labels so filters + layout icons fit one mobile row without crush. */
const shortLabels: Record<FeedFilter, string> = {
  articles: "Writing",
  visuals: "Visual",
  events: "Events",
};

function hrefFor(filter: FeedFilter) {
  // Articles is the default home — keep `/` clean.
  return filter === DEFAULT_FEED_FILTER ? "/" : `/?type=${filter}`;
}

export function FeedFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const current = resolveFeedFilter(searchParams.get("type"));

  return (
    <div
      className={pending ? "opacity-70 transition-opacity" : undefined}
      aria-busy={pending || undefined}
    >
      <AnimatedPills
        className="w-max max-w-none"
        followHover={false}
        items={FEED_FILTERS.map((filter) => ({
          key: filter,
          label: (
            <>
              <span className="sm:hidden">{shortLabels[filter]}</span>
              <span className="hidden sm:inline">{labels[filter]}</span>
            </>
          ),
          active: current === filter,
          "aria-label": `Show ${labels[filter]}`,
          onClick: () => {
            if (filter === current) return;
            startTransition(() => {
              router.push(hrefFor(filter), { scroll: false });
            });
          },
        }))}
      />
    </div>
  );
}
