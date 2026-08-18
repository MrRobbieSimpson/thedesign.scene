"use client";

import { useSearchParams } from "next/navigation";

import { AnimatedPills } from "@/components/ui/animated-pills";
import { FEED_FILTERS, isFeedFilter, type FeedFilter } from "@/lib/feed-mix";

const labels: Record<FeedFilter, string> = {
  all: "All",
  articles: "Articles",
  visuals: "Visuals",
  builds: "Builds",
  events: "Events",
};

export function FeedFilters() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("type") ?? "all";
  const current: FeedFilter = isFeedFilter(raw) ? raw : "all";

  return (
    <AnimatedPills
      className="w-fit max-w-full"
      items={FEED_FILTERS.map((filter) => ({
        key: filter,
        label: labels[filter],
        href: filter === "all" ? "/" : `/?type=${filter}`,
        active: current === filter,
      }))}
    />
  );
}
