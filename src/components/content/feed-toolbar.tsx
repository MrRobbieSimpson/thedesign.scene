"use client";

import { FeedLayoutSwitcher } from "@/components/content/feed-layout-switcher";
import type { FeedLayout } from "@/components/content/feed-layout";
import { cn } from "@/lib/utils";

/**
 * Single-row feed chrome: filters scroll on the left, layout icons
 * stay pinned and vertically centered on every breakpoint / tab.
 */
export function FeedToolbar({
  toolbar,
  layout = "big",
  onLayoutChange,
  count,
  hideLayoutSwitcher = false,
  className,
}: {
  toolbar?: React.ReactNode;
  layout?: FeedLayout;
  /** Required when the layout switcher is shown. */
  onLayoutChange?: (layout: FeedLayout) => void;
  count?: number;
  /** Visuals / Events tabs lock layout — no switcher chrome. */
  hideLayoutSwitcher?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        /* Mobile uses the floating capsule — don’t leave an empty toolbar gap. */
        "hidden w-full min-w-0 items-center gap-2 md:flex md:gap-3",
        className
      )}
    >
      <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {toolbar}
      </div>
      <div className="flex h-10 shrink-0 items-center gap-2 pl-0.5">
        {typeof count === "number" ? (
          <p className="text-xs tabular-nums text-muted-foreground/70">
            {count}
          </p>
        ) : null}
        {!hideLayoutSwitcher && onLayoutChange ? (
          <FeedLayoutSwitcher value={layout} onChange={onLayoutChange} />
        ) : null}
      </div>
    </div>
  );
}
