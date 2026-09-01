"use client";

import { useEffect, useTransition } from "react";
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
  const [pending, startTransition] = useTransition();
  const current = resolveFeedFilter(searchParams.get("type"));

  // Warm the Writing / Visuals / Events RSC payloads so switches feel instant.
  useEffect(() => {
    for (const filter of FEED_FILTERS) {
      router.prefetch(hrefFor(filter));
    }
  }, [router]);

  return (
    <div
      className={
        pending
          ? "opacity-70 transition-opacity duration-200"
          : "transition-opacity duration-200"
      }
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
            const href = hrefFor(filter);
            router.prefetch(href);
            startTransition(() => {
              router.push(href, { scroll: false });
            });
          },
        }))}
      />
    </div>
  );
}
