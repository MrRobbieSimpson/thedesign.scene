import type { CommunityBadge as CommunityBadgeKind } from "@/db/schema";
import { cn } from "@/lib/utils";

function FounderRibbon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "founder-ribbon-wrap relative flex w-[4.7rem] flex-col items-center",
        "rotate-[24.76deg]",
        className
      )}
    >
      {/* Ribbon Base Container — tails tuck under via negative mb */}
      <span className="relative z-[2] -mb-[0.6rem] flex w-full flex-col items-center px-[0.7rem]">
        <span
          className={cn(
            "flex items-center justify-center",
            "bg-gradient-to-b from-[#eeeae3] to-[#898989]",
            "px-[0.52rem] py-[0.17rem]"
          )}
        >
          <span className="whitespace-nowrap text-center text-[9px] leading-none text-[#211c19]">
            <span className="font-sans font-bold tracking-tight">SWD</span>
            <span className="font-sans font-medium tracking-tight">
              {" "}
              Founder
            </span>
          </span>
        </span>
      </span>

      {/* Ribbon tails — 13.657px, left flipped */}
      <span
        aria-hidden
        className="relative z-[1] flex w-full items-start justify-between px-[0.17rem]"
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
  );
}

/**
 * Community recognition.
 * Founder = Figma paper ribbon (15:72) — tilted cream→slate band, SWD + Founder.
 * Founding writer = quiet hairline pill.
 *
 * `placement="on-avatar"`: ribbon wraps the circle — ends behind the photo,
 * label in front. Put `relative z-10` on the Avatar.
 */
export function CommunityBadge({
  badge,
  size = "md",
  placement = "inline",
  className,
}: {
  badge: CommunityBadgeKind | null | undefined;
  size?: "sm" | "md";
  placement?: "inline" | "on-avatar";
  className?: string;
}) {
  if (!badge || badge === "none") return null;

  const compact = size === "sm";

  if (badge === "founder") {
    const onAvatarPos = compact
      ? "absolute -left-0.5 -bottom-2 origin-center scale-[0.72]"
      : "absolute left-0 -bottom-2.5 origin-center";

    if (placement === "on-avatar") {
      return (
        <>
          {/* Under layer — tucked behind the disc; ends/tails wrap the arc */}
          <span
            aria-hidden
            className={cn(
              "community-badge-founder pointer-events-none inline-flex shrink-0",
              onAvatarPos,
              "z-0",
              className
            )}
          >
            <FounderRibbon />
          </span>
          {/* Over layer — label only, clipped so sides stay “behind” */}
          <span
            title="Founder of sit with design"
            className={cn(
              "community-badge-founder pointer-events-none inline-flex shrink-0",
              onAvatarPos,
              "z-20",
              className
            )}
            // Keep the text band in front; hide side/tail so they read as wrapping under
            style={{ clipPath: "inset(0 14% 38% 14%)" }}
          >
            <FounderRibbon />
          </span>
        </>
      );
    }

    return (
      <span
        title="Founder of sit with design"
        className={cn(
          "community-badge-founder pointer-events-none inline-flex shrink-0",
          className
        )}
      >
        <FounderRibbon />
      </span>
    );
  }

  // Founding writer stays inline only — not an avatar seal
  if (placement === "on-avatar") return null;

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
