import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { Job } from "@/db/schema";
import { jobWorkModeLabel } from "@/lib/format";

/**
 * Quiet home callout when at least one curated role is open.
 */
export function JobsStrip({ job }: { job: Job }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-5 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Opening
          </p>
          <h2 className="font-heading text-lg tracking-tight sm:text-xl">
            {job.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {job.company}
            {" · "}
            {jobWorkModeLabel(job.workMode)}
            {job.location ? ` · ${job.location}` : null}
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground transition-opacity hover:opacity-80"
        >
          View openings
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
