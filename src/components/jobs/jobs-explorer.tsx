"use client";

import { Suspense, useMemo, useState } from "react";

import { FeedFilters } from "@/components/content/feed-filters";
import { JobCard } from "@/components/jobs/job-card";
import { AnimatedPills } from "@/components/ui/animated-pills";
import { EmptyState } from "@/components/ui/empty-state";
import type { Job, JobWorkMode } from "@/db/schema";

type Filter = "all" | JobWorkMode;

const filters: {
  key: Filter;
  label: string;
  shortLabel: string;
}[] = [
  { key: "all", label: "All", shortLabel: "All" },
  { key: "remote", label: "Remote", shortLabel: "Remote" },
  { key: "hybrid", label: "Hybrid", shortLabel: "Hybrid" },
  { key: "onsite", label: "On site", shortLabel: "On-site" },
];

function JobsToolbar({
  filter,
  onFilterChange,
  showWorkModes,
}: {
  filter: Filter;
  onFilterChange: (next: Filter) => void;
  showWorkModes: boolean;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
      {/* Writing / Visuals / Events — own row on mobile, left on desktop */}
      <div className="min-w-0 w-full overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] md:w-auto md:flex-1 [&::-webkit-scrollbar]:hidden">
        <Suspense
          fallback={
            <div className="h-10 w-56 max-w-full animate-pulse rounded-full bg-muted" />
          }
        >
          <FeedFilters />
        </Suspense>
      </div>

      {/* Work mode — never share a cramped row with feed nav on small screens.
          size="md" is required: size="sm" is icon-only (32×32) and wraps text. */}
      {showWorkModes ? (
        <div className="min-w-0 w-full overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] md:w-auto md:max-w-none md:shrink-0 [&::-webkit-scrollbar]:hidden">
          <AnimatedPills
            size="md"
            followHover={false}
            aria-label="Filter by work mode"
            className="w-max max-w-none"
            items={filters.map((item) => ({
              key: item.key,
              label: (
                <>
                  <span className="sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </>
              ),
              active: filter === item.key,
              "aria-label": item.label,
              onClick: () => onFilterChange(item.key),
            }))}
          />
        </div>
      ) : null}
    </div>
  );
}

export function JobsExplorer({ jobs }: { jobs: Job[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    if (filter === "all") return jobs;
    return jobs.filter((job) => job.workMode === filter);
  }, [jobs, filter]);

  if (jobs.length === 0) {
    return (
      <div className="space-y-8">
        <JobsToolbar
          filter={filter}
          onFilterChange={setFilter}
          showWorkModes={false}
        />
        <EmptyState
          eyebrow="Openings"
          title="Nothing open right now"
          description="When there’s a role we’d recommend to a friend, it’ll appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <JobsToolbar filter={filter} onFilterChange={setFilter} showWorkModes />

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
