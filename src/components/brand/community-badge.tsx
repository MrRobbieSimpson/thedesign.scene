import type { CommunityBadge as CommunityBadgeKind } from "@/db/schema";
import { cn } from "@/lib/utils";

/**
 * Community recognition chips.
 * Founder = Figma paper ribbon (tilted, SWD + Founder) — swap SWD for logo later.
 * Founding writer = quiet hairline pill.
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
          "community-badge-founder group/founder relative inline-flex shrink-0",
          "origin-center",
          compact ? "scale-[0.85]" : "scale-100",
          className
        )}
      >
        <span
          className={cn(
            "relative flex w-[4.75rem] flex-col items-center",
            "rotate-[22deg] transition-transform duration-300",
            "ease-[cubic-bezier(0.22,1,0.36,1)]",
            "group-hover/founder:rotate-[18deg] group-hover/founder:scale-[1.04]"
          )}
        >
          {/* Ribbon body */}
          <span
            className={cn(
              "founder-ribbon-base relative z-[2] -mb-[0.55rem] flex items-center justify-center",
              "bg-gradient-to-b from-[#eeeae3] to-[#898989]",
              "px-2 py-[0.2rem]",
              "shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
            )}
          >
            <span className="relative z-[1] whitespace-nowrap text-center text-[9px] leading-none text-[#211c19]">
              <span className="font-sans font-bold tracking-tight">SWD</span>
              <span className="font-sans font-medium tracking-tight">
                {" "}
                Founder
              </span>
            </span>
          </span>

          {/* Ribbon tails */}
          <span
            aria-hidden
            className="relative z-[1] flex w-full items-start justify-between px-[0.15rem]"
          >
            <img
              src="/badges/ribbon-bottom-l.svg"
              alt=""
              width={14}
              height={14}
              className="size-[0.85rem] -scale-y-100 rotate-180"
            />
            <img
              src="/badges/ribbon-bottom-r.svg"
              alt=""
              width={14}
              height={14}
              className="size-[0.85rem]"
            />
          </span>
        </span>
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
