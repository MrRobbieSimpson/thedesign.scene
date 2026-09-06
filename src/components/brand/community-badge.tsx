import type { CommunityBadge as CommunityBadgeKind } from "@/db/schema";
import { cn } from "@/lib/utils";

/**
 * Paper ribbon wrapped along the avatar’s circular frame.
 * Band follows the rim arc; forked tails hang off the bottom end.
 * Palette from Figma 15:72 — #eeeae3 → #898989, text #211c19.
 */
function FounderRibbonOnFrame({
  size,
  className,
}: {
  /** Avatar diameter in CSS px. */
  size: number;
  className?: string;
}) {
  const uid = `fr-${size}`;
  const r = size / 2;
  const band = Math.max(12, size * 0.15);
  const cx = r;
  const cy = r;
  // Sit on the frame — slightly outside the photo edge
  const rim = r + 1;

  // Bottom-left arc on the frame (SVG: 0° right, 90° bottom, 180° left)
  const a0 = (105 * Math.PI) / 180;
  const a1 = (178 * Math.PI) / 180;

  const rOut = rim + band / 2;
  const rIn = Math.max(rim - band / 2, r * 0.72);

  const pt = (radius: number, a: number) => ({
    x: cx + radius * Math.cos(a),
    y: cy + radius * Math.sin(a),
  });

  const o0 = pt(rOut, a0);
  const o1 = pt(rOut, a1);
  const i0 = pt(rIn, a0);
  const i1 = pt(rIn, a1);

  // Clockwise along bottom-left (sweep=1)
  const bandPath = [
    `M ${o0.x} ${o0.y}`,
    `A ${rOut} ${rOut} 0 0 1 ${o1.x} ${o1.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${rIn} ${rIn} 0 0 0 ${i0.x} ${i0.y}`,
    "Z",
  ].join(" ");

  // Text sits on the mid-rim arc
  const mid = rim;
  const t0 = pt(mid, a0);
  const t1 = pt(mid, a1);
  const textArc = `M ${t0.x} ${t0.y} A ${mid} ${mid} 0 0 1 ${t1.x} ${t1.y}`;

  // Forked tails at the bottom end (a0), hanging outward along the tangent
  const tailLen = band * 1.55;
  const tangent = a0 + Math.PI / 2; // outward from arc direction
  const ux = Math.cos(tangent);
  const uy = Math.sin(tangent);
  const nx = Math.cos(a0);
  const ny = Math.sin(a0);
  // Two-prong swallowtail
  const tip = {
    x: o0.x + ux * tailLen,
    y: o0.y + uy * tailLen,
  };
  const notch = {
    x: o0.x + ux * tailLen * 0.52 + nx * band * -0.05,
    y: o0.y + uy * tailLen * 0.52 + ny * band * -0.05,
  };
  const wing = band * 0.55;
  const tailPath = [
    `M ${i0.x} ${i0.y}`,
    `L ${o0.x} ${o0.y}`,
    `L ${tip.x + nx * wing} ${tip.y + ny * wing}`,
    `L ${notch.x} ${notch.y}`,
    `L ${tip.x - nx * wing * 0.85} ${tip.y - ny * wing * 0.85}`,
    "Z",
  ].join(" ");

  // Second smaller tail at the upper end (a1), tucked short
  const tailLen2 = band * 0.95;
  const tangent1 = a1 + Math.PI / 2;
  const u1x = Math.cos(tangent1);
  const u1y = Math.sin(tangent1);
  const n1x = Math.cos(a1);
  const n1y = Math.sin(a1);
  const tip1 = {
    x: o1.x + u1x * tailLen2,
    y: o1.y + u1y * tailLen2,
  };
  const notch1 = {
    x: o1.x + u1x * tailLen2 * 0.5,
    y: o1.y + u1y * tailLen2 * 0.5,
  };
  const tailPath2 = [
    `M ${i1.x} ${i1.y}`,
    `L ${o1.x} ${o1.y}`,
    `L ${tip1.x + n1x * wing * 0.7} ${tip1.y + n1y * wing * 0.7}`,
    `L ${notch1.x} ${notch1.y}`,
    `L ${tip1.x - n1x * wing * 0.55} ${tip1.y - n1y * wing * 0.55}`,
    "Z",
  ].join(" ");

  const fontSize = Math.max(7, size * 0.092);
  const pad = Math.ceil(band * 2 + tailLen);
  const vbMin = -pad * 0.25;
  const vbSize = size + pad;

  return (
    <svg
      width={vbSize}
      height={vbSize}
      viewBox={`${vbMin} ${vbMin} ${vbSize} ${vbSize}`}
      className={cn(
        "founder-ribbon-wrap pointer-events-none absolute overflow-visible",
        className
      )}
      style={{
        left: -pad * 0.25,
        top: -pad * 0.25,
        width: vbSize,
        height: vbSize,
      }}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={`${uid}-fill`}
          gradientUnits="userSpaceOnUse"
          x1={cx}
          y1={cy - r}
          x2={cx}
          y2={cy + r}
        >
          <stop stopColor="#eeeae3" />
          <stop offset="1" stopColor="#898989" />
        </linearGradient>
        <path id={`${uid}-arc`} d={textArc} fill="none" />
      </defs>

      <path d={bandPath} fill={`url(#${uid}-fill)`} />
      <path d={tailPath} fill={`url(#${uid}-fill)`} />
      <path d={tailPath2} fill={`url(#${uid}-fill)`} />
      {/* Soft fold on lower tail */}
      <path
        d={`M ${o0.x} ${o0.y} L ${notch.x} ${notch.y} L ${i0.x} ${i0.y} Z`}
        fill="black"
        opacity={0.22}
      />

      <text
        fill="#211c19"
        fontSize={fontSize}
        fontFamily="var(--font-sans), ui-sans-serif, system-ui, sans-serif"
        letterSpacing="0.04em"
      >
        <textPath
          href={`#${uid}-arc`}
          startOffset="50%"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          <tspan fontWeight={700}>SWD</tspan>
          <tspan fontWeight={500}> Founder</tspan>
        </textPath>
      </text>
    </svg>
  );
}

/**
 * Community recognition.
 * Founder = ribbon wrapped around the avatar’s circular frame.
 * Founding writer = quiet hairline pill.
 *
 * `placement="on-avatar"` — wrap a `relative` parent around the Avatar and
 * pass `avatarSize` matching the photo.
 */
export function CommunityBadge({
  badge,
  size = "md",
  placement = "inline",
  avatarSize,
  className,
}: {
  badge: CommunityBadgeKind | null | undefined;
  size?: "sm" | "md";
  placement?: "inline" | "on-avatar";
  /** Avatar diameter in px (defaults 96 md / 44 sm). */
  avatarSize?: number;
  className?: string;
}) {
  if (!badge || badge === "none") return null;

  const compact = size === "sm";
  const frameSize = avatarSize ?? (compact ? 44 : 96);

  if (badge === "founder") {
    if (placement === "on-avatar") {
      return (
        <span
          title="Founder of sit with design"
          className={cn(
            "community-badge-founder pointer-events-none absolute inset-0 z-20",
            className
          )}
        >
          <FounderRibbonOnFrame size={frameSize} />
        </span>
      );
    }

    return (
      <span
        title="Founder of sit with design"
        className={cn(
          "community-badge-founder inline-flex shrink-0 items-center",
          "bg-gradient-to-b from-[#eeeae3] to-[#898989]",
          "px-1.5 py-0.5 text-[9px] leading-none text-[#211c19]",
          className
        )}
      >
        <span className="font-sans font-bold tracking-tight">SWD</span>
        <span className="font-sans font-medium tracking-tight"> Founder</span>
      </span>
    );
  }

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
