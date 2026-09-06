import type { CommunityBadge as CommunityBadgeKind } from "@/db/schema";
import { cn } from "@/lib/utils";

/**
 * Sharp community recognition — worth showing off.
 * Founder = gold medallion (SWD mark until logo). Founding writer = hairline ribbon.
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

  const compact = size === "sm";

  if (badge === "founder") {
    return (
      <span
        title="Founder of sit with design"
        className={cn(
          "community-badge-founder group/founder relative inline-flex shrink-0 flex-col items-center",
          className
        )}
      >
        {/* Medallion */}
        <span
          className={cn(
            "relative isolate flex flex-col items-center justify-center overflow-hidden rounded-full",
            "founder-medallion",
            "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "group-hover/founder:scale-[1.06]",
            compact ? "size-9" : "size-14"
          )}
        >
          {/* Outer rim */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full founder-medallion-rim"
          />
          {/* Inner face */}
          <span
            aria-hidden
            className={cn(
              "absolute rounded-full founder-medallion-face",
              compact ? "inset-[2px]" : "inset-[3px]"
            )}
          />
          {/* Content */}
          <span className="relative z-[1] flex flex-col items-center justify-center gap-0.5">
            <span
              className={cn(
                "font-sans font-black tracking-tight text-[oklch(0.28_0.04_75)]",
                "drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]",
                compact ? "text-[8px] leading-none" : "text-[11px] leading-none"
              )}
            >
              SWD
            </span>
            <span
              className={cn(
                "font-sans font-bold uppercase tracking-[0.14em]",
                "text-[oklch(0.32_0.05_75)]",
                "drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]",
                compact ? "text-[5px] leading-none" : "text-[7px] leading-none"
              )}
            >
              Founder
            </span>
          </span>
        </span>

        {/* Soft ribbon tails */}
        {!compact ? (
          <span
            aria-hidden
            className="founder-ribbon relative -mt-1 flex h-3 w-[2.75rem] items-start justify-center"
          >
            <span className="founder-ribbon-tail founder-ribbon-tail--left" />
            <span className="founder-ribbon-tail founder-ribbon-tail--right" />
          </span>
        ) : null}
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
        className={cn(
          "font-heading font-medium tracking-tight text-foreground",
          compact ? "text-[10px]" : "text-[11px]"
        )}
      >
        Founding writer
      </span>
    </span>
  );
}
