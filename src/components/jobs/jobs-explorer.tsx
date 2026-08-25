"use client";

import { useMemo, useState } from "react";

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
      <AnimatedPills
        followHover={false}
        aria-label="Filter by work mode"
        items={filters.map((item) => ({
          key: item.key,
          label: item.label,
          active: filter === item.key,
          onClick: () => setFilter(item.key),
        }))}
      />

      {visible.length === 0 ? (
        <EmptyState
          size="md"
          title="No openings in this mode"
          description="Try another filter — remote, hybrid, or on site."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {visible.map((job, index) => (
            <JobCard key={job.id} job={job} featured={index === 0 && filter === "all"} />
          ))}
        </div>
      )}
    </div>
  );
}
