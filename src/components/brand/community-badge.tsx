import type { CommunityBadge as CommunityBadgeKind } from "@/db/schema";
import { cn } from "@/lib/utils";

const LABELS: Record<Exclude<CommunityBadgeKind, "none">, string> = {
  founder: "Founder",
  founding_writer: "Founding writer",
};

/**
 * Sharp community recognition chip — worth showing off, never shouty.
 * Founder = ink + warm gold pin. Founding writer = refined hairline ribbon.
 */
export function CommunityBadge({
  badge,
  size = "md",
  className,
}: {
  badge: CommunityBadgeKind | null | undefined;
  size?: "sm" | "md";
  className?: string;
}) {
  if (!badge || badge === "none") return null;

  const label = LABELS[badge];
  const compact = size === "sm";

  if (badge === "founder") {
    return (
      <span
        title="Founder of sit with design"
        className={cn(
          "community-badge-founder inline-flex items-center gap-1.5 rounded-full",
          "bg-foreground text-background",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_1px_2px_rgba(0,0,0,0.18)]",
          "ring-1 ring-inset ring-white/10",
          compact
            ? "h-5 px-1.5 text-[9px] font-semibold tracking-[0.14em] uppercase"
            : "h-6 px-2 text-[10px] font-semibold tracking-[0.16em] uppercase",
          className
        )}
      >
        <span
          aria-hidden
          className={cn(
            "rounded-full bg-[oklch(0.84_0.11_85)]",
            "shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_0_8px_rgba(212,175,55,0.45)]",
            compact ? "size-1" : "size-1.5"
          )}
        />
        {label}
      </span>
    );
  }

  return (
    <span
      title="Founding writer — early sit with design cohort"
      className={cn(
        "community-badge-founding inline-flex items-center gap-1 rounded-full",
        "border border-foreground/12 bg-gradient-to-b from-foreground/[0.06] to-foreground/[0.02]",
        "text-foreground/90",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)]",
        "dark:border-white/12 dark:from-white/[0.08] dark:to-white/[0.02]",
        "dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]",
        compact
          ? "h-5 px-1.5 text-[9px] font-medium tracking-[0.08em]"
          : "h-6 px-2 text-[10px] font-medium tracking-[0.1em]",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "font-heading font-medium tracking-tight text-foreground",
          compact ? "text-[10px]" : "text-[11px]"
        )}
      >
        {label}
      </span>
    </span>
  );
}
