import { Children, isValidElement } from "react";

import type { FeedLayout } from "@/components/content/feed-layout";
import { cn } from "@/lib/utils";

/**
 * Feed layouts: big / small / mosaic.
 *
 * Mosaic is CSS-column masonry with a calm gap and rounded tiles
 * (desktop only — callers remap mosaic → small on mobile). Items stay
 * inline-block + overflow hidden so they don’t bleed across columns.
 */
export function FeedLayoutGrid({
  layout,
  children,
  className,
}: {
  layout: FeedLayout;
  children: React.ReactNode;
  className?: string;
}) {
  const items = Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;

  if (layout === "mosaic") {
    return (
      <div
        className={cn(
          "feed-mosaic w-full columns-2 gap-0 md:columns-3",
          className
        )}
      >
        {items.map((child) => {
          const key = isValidElement(child) ? child.key : undefined;
          return (
            <div key={key ?? undefined} className="feed-mosaic-item">
              {child}
            </div>
          );
        })}
      </div>
    );
  }

  if (layout === "small") {
    return (
      <div
        className={cn(
          // Match mosaic rhythm; top pad so hover lift isn’t clipped by the page.
          "grid w-full grid-cols-2 items-start gap-3 pt-1 md:gap-4",
          className
        )}
      >
        {items.map((child) => {
          const key = isValidElement(child) ? child.key : undefined;
          return (
            <div
              key={key ?? undefined}
              className="relative z-0 min-w-0 w-full overflow-visible transition-[z-index] hover:z-10 focus-within:z-10 [&>*]:h-full"
            >
              {child}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col gap-10 sm:gap-14", className)}>
      {items.map((child) => {
        const key = isValidElement(child) ? child.key : undefined;
        return (
          <div key={key ?? undefined} className="min-w-0 w-full">
            {child}
          </div>
        );
      })}
    </div>
  );
}
