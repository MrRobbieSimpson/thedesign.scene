"use client";

import { LayoutDashboard, LayoutGrid, RectangleHorizontal } from "lucide-react";

import type { FeedLayout } from "@/components/content/feed-layout";
import { AnimatedPills } from "@/components/ui/animated-pills";

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
    <AnimatedPills
      size="sm"
      aria-label="Feed layout"
      // Touch devices: hover-follow steals the first tap — keep clicks direct.
      followHover={false}
      items={options.map((option) => {
        const Icon = option.icon;
        return {
          key: option.value,
          label: <Icon className="size-3.5" />,
          title: option.label,
          "aria-label": option.label,
          active: value === option.value,
          onClick: () => onChange(option.value),
        };
      })}
    />
  );
}
