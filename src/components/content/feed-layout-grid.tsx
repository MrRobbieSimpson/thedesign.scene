import { Children, isValidElement } from "react";

import type { FeedLayout } from "@/components/content/feed-layout";
import { cn } from "@/lib/utils";

/**
 * Renders feed items in big / small / mosaic layouts.
 *
 * Mosaic uses CSS Grid — not multi-column. CSS `columns` + `break-inside-avoid`
 * was overlapping cards on mobile and desktop.
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

  const cell = (child: React.ReactNode, extra?: string) => {
    const key = isValidElement(child) ? child.key : undefined;
    return (
      <div
        key={key ?? undefined}
        className={cn(
          "relative z-0 min-w-0 w-full isolate overflow-hidden [&>*]:h-full",
          extra
        )}
      >
        {child}
      </div>
    );
  };

  if (layout === "mosaic") {
    return (
      <div
        className={cn(
          "grid w-full grid-cols-1 items-start gap-4",
          "sm:grid-cols-2 sm:gap-5",
          "md:grid-cols-3",
          className
        )}
      >
        {items.map((child) => cell(child))}
      </div>
    );
  }

  if (layout === "small") {
    return (
      <div
        className={cn(
          "grid w-full grid-cols-2 items-start gap-3 sm:gap-5",
          className
        )}
      >
        {items.map((child) => cell(child))}
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col gap-10 sm:gap-14", className)}>
      {items.map((child) => cell(child, "overflow-visible"))}
    </div>
  );
}
