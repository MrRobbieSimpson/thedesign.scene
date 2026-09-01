"use client";

/**
 * Subtle enter animation when switching Writing / Visuals / Events.
 * Remounts on filter change so the CSS animation re-runs without
 * remounting the shared header or filter pills (pass those outside).
 */
export function FeedViewTransition({
  viewKey,
  children,
}: {
  viewKey: string;
  children: React.ReactNode;
}) {
  return (
    <div key={viewKey} className="feed-enter min-w-0">
      {children}
    </div>
  );
}
