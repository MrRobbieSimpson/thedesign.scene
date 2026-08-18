"use client";

import { useSearchParams } from "next/navigation";

import { AnimatedPills } from "@/components/ui/animated-pills";
import { CONTENT_TYPES, type ContentType } from "@/db/schema";

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
    <AnimatedPills
      className="max-w-full"
      items={filters.map((filter) => ({
        key: filter.value,
        label: filter.label,
        href: filter.value === "all" ? "/" : `/?type=${filter.value}`,
        active: current === filter.value,
      }))}
    />
  );
}
