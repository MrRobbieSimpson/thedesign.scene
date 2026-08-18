"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CONTENT_TYPES, type ContentType } from "@/db/schema";
import { cn } from "@/lib/utils";

const filters: { value: ContentType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "article", label: "Articles" },
  { value: "thought", label: "Thoughts" },
  { value: "visual", label: "Visual" },
  { value: "build", label: "Builds" },
  { value: "news", label: "News" },
  { value: "post", label: "Posts" },
];

export function FeedFilters() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("type") ?? "all";
  const current = (
    raw === "all" || (CONTENT_TYPES as readonly string[]).includes(raw)
      ? raw
      : "all"
  ) as ContentType | "all";

  return (
    <div className="flex max-w-full flex-wrap gap-1.5 rounded-full border border-border/70 bg-muted/40 p-1">
      {filters.map((filter) => {
        const active = current === filter.value;
        const href =
          filter.value === "all" ? "/" : `/?type=${filter.value}`;

        return (
          <Link
            key={filter.value}
            href={href}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm transition-all",
              active
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
            scroll={false}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}
