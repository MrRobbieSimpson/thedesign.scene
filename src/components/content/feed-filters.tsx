"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const current = resolveFeedFilter(searchParams.get("type"));

  // Keep all three tab payloads warm.
  useEffect(() => {
    for (const filter of FEED_FILTERS) {
      router.prefetch(hrefFor(filter));
    }
  }, [router]);

  return (
    <AnimatedPills
      className="w-max max-w-none"
      followHover={false}
      items={FEED_FILTERS.map((filter) => ({
        key: filter,
        // Native <Link prefetch> — smoother than imperative router.push.
        href: hrefFor(filter),
        label: (
          <>
            <span className="sm:hidden">{shortLabels[filter]}</span>
            <span className="hidden sm:inline">{labels[filter]}</span>
          </>
        ),
        active: current === filter,
        "aria-label": `Show ${labels[filter]}`,
      }))}
    />
  );
}
