import { Children, isValidElement } from "react";

import type { FeedLayout } from "@/components/content/feed-layout";
import { cn } from "@/lib/utils";

/**
 * Feed layouts: big / small / mosaic.
 *
 * Mosaic is a stable 2-up CSS grid (not multi-column) so cards can’t
 * fracture the page or let the footer paint through the feed.
 */
export function FeedLayoutGrid({
  layout,
  children,
  className,
  dense = false,
}: {
  layout: FeedLayout;
  children: React.ReactNode;
  className?: string;
  /** Visuals — tighter gap. */
  dense?: boolean;
}) {
  const items = Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;

  if (layout === "mosaic") {
    return (
      <div
        className={cn(
          "feed-mosaic w-full min-w-0",
          dense && "feed-mosaic--dense",
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
      <div className={cn("feed-small w-full", className)}>
        {items.map((child) => {
          const key = isValidElement(child) ? child.key : undefined;
          return (
            <div key={key ?? undefined} className="feed-small-item">
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
