"use client";

import { LayoutDashboard, LayoutGrid, RectangleHorizontal } from "lucide-react";

import type { FeedLayout } from "@/components/content/feed-layout";
import { cn } from "@/lib/utils";

const options: {
  value: FeedLayout;
  label: string;
  icon: typeof LayoutGrid;
}[] = [
  { value: "big", label: "Big cards", icon: RectangleHorizontal },
  { value: "small", label: "Small cards", icon: LayoutGrid },
  { value: "mosaic", label: "Mosaic", icon: LayoutDashboard },
];

export function FeedLayoutSwitcher({
  value,
  onChange,
}: {
  value: FeedLayout;
  onChange: (layout: FeedLayout) => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-muted/40 p-1"
      role="group"
      aria-label="Feed layout"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            title={option.label}
            aria-label={option.label}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full transition-all",
              active
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
