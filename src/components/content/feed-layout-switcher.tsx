"use client";

import { LayoutDashboard, LayoutGrid, RectangleHorizontal } from "lucide-react";

import type { FeedLayout } from "@/components/content/feed-layout";
import { AnimatedPills } from "@/components/ui/animated-pills";
import { useIsSmUp } from "@/lib/use-media-query";

const options: {
  value: FeedLayout;
  label: string;
  icon: typeof LayoutGrid;
  desktopOnly?: boolean;
}[] = [
  { value: "big", label: "Big cards", icon: RectangleHorizontal },
  { value: "small", label: "Small cards", icon: LayoutGrid },
  {
    value: "mosaic",
    label: "Mosaic",
    icon: LayoutDashboard,
    desktopOnly: true,
  },
];

export function FeedLayoutSwitcher({
  value,
  onChange,
}: {
  value: FeedLayout;
  onChange: (layout: FeedLayout) => void;
}) {
  const smUp = useIsSmUp();
  const visible = options.filter((option) => smUp || !option.desktopOnly);
  // Mosaic isn’t offered on mobile — treat it as small for the active state.
  const activeValue = !smUp && value === "mosaic" ? "small" : value;

  return (
    <AnimatedPills
      size="sm"
      aria-label="Feed layout"
      followHover={false}
      className="shrink-0"
      items={visible.map((option) => {
        const Icon = option.icon;
        return {
          key: option.value,
          label: <Icon className="size-3.5" aria-hidden />,
          title: option.label,
          "aria-label": option.label,
          active: activeValue === option.value,
          onClick: () => onChange(option.value),
        };
      })}
    />
  );
}

/** Remap desktop-only layouts for the current viewport. */
export function resolveFeedLayout(
  layout: FeedLayout,
  smUp: boolean
): FeedLayout {
  if (!smUp && layout === "mosaic") return "small";
  return layout;
}
