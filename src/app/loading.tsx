/**
 * Instant shell while the home (or other) segment streams in.
 * Keeps the layout calm instead of a blank flash.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[45rem] px-5 py-10 sm:px-6 sm:py-20">
      <div className="mb-10 space-y-4 sm:mb-16 sm:space-y-5">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-9 w-4/5 max-w-md animate-pulse rounded-lg bg-muted sm:h-12" />
        <div className="h-4 w-full max-w-lg animate-pulse rounded bg-muted/80" />
        <div className="h-4 w-3/5 max-w-sm animate-pulse rounded bg-muted/70" />
      </div>
      <div className="mb-8 h-10 w-64 max-w-full animate-pulse rounded-full bg-muted" />
      <div className="space-y-5">
        <div className="h-40 animate-pulse rounded-2xl bg-muted/60" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted/50" />
        <div className="h-32 animate-pulse rounded-2xl bg-muted/40" />
      </div>
    </div>
  );
}
