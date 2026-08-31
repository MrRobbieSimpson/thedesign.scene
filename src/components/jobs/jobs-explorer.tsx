"use client";

import { Suspense, useMemo, useState } from "react";

import { FeedFilters } from "@/components/content/feed-filters";
import { JobCard } from "@/components/jobs/job-card";
import { AnimatedPills } from "@/components/ui/animated-pills";
import { EmptyState } from "@/components/ui/empty-state";
import type { Job, JobWorkMode } from "@/db/schema";

type Filter = "all" | JobWorkMode;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "remote", label: "Remote" },
  { key: "hybrid", label: "Hybrid" },
  { key: "onsite", label: "On site" },
];

export function JobsExplorer({ jobs }: { jobs: Job[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    if (filter === "all") return jobs;
    return jobs.filter((job) => job.workMode === filter);
  }, [jobs, filter]);

  if (jobs.length === 0) {
    return (
      <EmptyState
        eyebrow="Openings"
        title="Nothing open right now"
        description="When there’s a role we’d recommend to a friend, it’ll appear here."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/*
        Same pattern as the feed toolbar:
        left = Writing / Visuals / Events nav
        right = work-mode filters
      */}
      <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3">
        <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Suspense
            fallback={
              <div className="h-10 w-56 max-w-full animate-pulse rounded-full bg-muted" />
            }
          >
            <FeedFilters />
          </Suspense>
        </div>
        <div className="flex h-10 shrink-0 items-center gap-2 pl-0.5">
          <div className="max-w-[55vw] overflow-x-auto overscroll-x-contain sm:max-w-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <AnimatedPills
              size="sm"
              followHover={false}
              aria-label="Filter by work mode"
              className="w-max"
              items={filters.map((item) => ({
                key: item.key,
                label: item.label,
                active: filter === item.key,
                onClick: () => setFilter(item.key),
              }))}
            />
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          size="md"
          title="No openings in this mode"
          description="Try another filter — remote, hybrid, or on site."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {visible.map((job, index) => (
            <JobCard
              key={job.id}
              job={job}
              featured={index === 0 && filter === "all"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
