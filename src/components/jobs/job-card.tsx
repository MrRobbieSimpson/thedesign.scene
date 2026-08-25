import Link from "next/link";
import { ArrowUpRight, Building2, MapPin, Monitor, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Job, JobWorkMode } from "@/db/schema";
import { jobWorkModeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

function ModeGlyph({ mode }: { mode: JobWorkMode }) {
  if (mode === "remote") return <Monitor className="size-3.5" />;
  if (mode === "hybrid") return <Users className="size-3.5" />;
  return <MapPin className="size-3.5" />;
}

export function JobCard({
  job,
  featured = false,
}: {
  job: Job;
  featured?: boolean;
}) {
  const content = (
    <article
      className={cn(
        "group relative flex h-full flex-col justify-between gap-5 rounded-2xl border bg-card transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        featured
          ? "border-foreground/15 p-7 shadow-[0_1px_0_rgba(0,0,0,0.02)] sm:p-8"
          : "border-border/70 p-6",
        "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_16px_48px_-28px_rgba(0,0,0,0.4)] active:translate-y-0 active:scale-[0.985]"
      )}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={featured ? "default" : "secondary"}
            className={cn(
              "gap-1.5",
              featured && "border-0 bg-foreground text-background"
            )}
          >
            <ModeGlyph mode={job.workMode} />
            {jobWorkModeLabel(job.workMode)}
          </Badge>
          {job.roleKind ? (
            <Badge variant="outline">{job.roleKind}</Badge>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="size-3.5 shrink-0" />
            <span className="truncate">{job.company}</span>
          </p>
          <h3
            className={cn(
              "font-heading tracking-tight text-balance",
              featured ? "text-3xl leading-snug" : "text-2xl leading-snug"
            )}
          >
            {job.title}
          </h3>
          {job.description ? (
            <p
              className={cn(
                "leading-relaxed text-muted-foreground",
                featured ? "text-[0.95rem]" : "text-sm"
              )}
            >
              {job.description}
            </p>
          ) : null}
        </div>

        {job.editorNote ? (
          <p className="border-l border-foreground/20 pl-3 text-sm leading-relaxed text-muted-foreground/90">
            <span className="font-medium text-foreground/80">Why this is here. </span>
            {job.editorNote}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {job.location ??
              (job.workMode === "remote" ? "Remote" : "Location TBA")}
          </span>
        </span>
        {job.url ? (
          <span className="inline-flex shrink-0 items-center gap-1 font-medium transition-colors group-hover:text-foreground">
            Apply
            <ArrowUpRight className="size-3.5" />
          </span>
        ) : null}
      </div>
    </article>
  );

  if (job.url) {
    return (
      <Link
        href={job.url}
        target="_blank"
        rel="noreferrer"
        className="block h-full"
      >
        {content}
      </Link>
    );
  }

  return content;
}
