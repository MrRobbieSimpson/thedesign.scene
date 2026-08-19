/**
 * Quiet end-of-piece ornament — marks the close before author / related.
 * Sit-with persistence lands in a later phase; this is the calm landing.
 */
export function ArticleEnd() {
  return (
    <div className="mt-16 flex flex-col items-center gap-3" aria-hidden>
      <span className="block h-px w-10 bg-foreground/20" />
      <p className="font-serif text-sm italic text-muted-foreground/70">
        End of piece
      </p>
    </div>
  );
}
