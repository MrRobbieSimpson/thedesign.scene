import { cn } from "@/lib/utils";

export function EditorNote({
  note,
  className,
}: {
  note: string;
  className?: string;
}) {
  const trimmed = note.trim();
  if (!trimmed) return null;

  return (
    <aside
      className={cn(
        "rounded-xl border border-border/60 bg-muted/25 px-4 py-3",
        className
      )}
    >
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Why this is here
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {trimmed}
      </p>
    </aside>
  );
}
