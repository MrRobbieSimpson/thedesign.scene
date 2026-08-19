import { cn } from "@/lib/utils";

type EditorNoteVariant = "feed" | "reading";

export function EditorNote({
  note,
  variant = "feed",
  className,
}: {
  note: string;
  variant?: EditorNoteVariant;
  className?: string;
}) {
  const trimmed = note.trim();
  if (!trimmed) return null;

  if (variant === "reading") {
    return (
      <aside
        className={cn(
          "rounded-2xl border border-border/50 bg-muted/20 px-5 py-4",
          className
        )}
      >
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Why this is here
        </p>
        <p className="mt-2 font-serif text-[0.9375rem] leading-relaxed text-muted-foreground">
          {trimmed}
        </p>
      </aside>
    );
  }

  // Feed — left-rule aside, low mass so it doesn’t read as a nested card.
  return (
    <aside
      className={cn(
        "border-l border-foreground/15 py-0.5 pl-3.5",
        className
      )}
    >
      <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground/80 uppercase">
        Why this is here
      </p>
      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
        {trimmed}
      </p>
    </aside>
  );
}
