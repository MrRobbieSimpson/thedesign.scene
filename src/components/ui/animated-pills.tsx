"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

export type AnimatedPillItem = {
  key: string;
  label: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  title?: string;
  "aria-label"?: string;
};

type AnimatedPillsProps = {
  items: AnimatedPillItem[];
  className?: string;
  size?: "sm" | "md";
  variant?: "segmented" | "ghost";
  /** Hover-follow highlight (disabled by default on touch). */
  followHover?: boolean;
  "aria-label"?: string;
};

type Indicator = {
  left: number;
  top: number;
  width: number;
  height: number;
  ready: boolean;
};

function emptyIndicator(): Indicator {
  return { left: 0, top: 0, width: 0, height: 0, ready: false };
}

export function AnimatedPills({
  items,
  className,
  size = "md",
  variant = "segmented",
  followHover = true,
  "aria-label": ariaLabel,
}: AnimatedPillsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [canFollowHover, setCanFollowHover] = useState(false);
  const [indicator, setIndicator] = useState<Indicator>(emptyIndicator);

  useEffect(() => {
    if (!followHover) {
      setCanFollowHover(false);
      return;
    }
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setCanFollowHover(fine.matches);
    sync();
    fine.addEventListener("change", sync);
    return () => fine.removeEventListener("change", sync);
  }, [followHover]);

  const activeKey = items.find((item) => item.active)?.key ?? null;
  const highlightKey =
    canFollowHover && hoverKey != null ? hoverKey : activeKey;
  const hoveringOther = Boolean(
    canFollowHover && hoverKey != null && hoverKey !== activeKey
  );

  const measure = useCallback(() => {
    const track = trackRef.current;
    const key = highlightKey;
    if (!track || !key) {
      setIndicator(emptyIndicator());
      return;
    }

    const el = itemRefs.current.get(key);
    if (!el) {
      setIndicator(emptyIndicator());
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    setIndicator({
      left: elRect.left - trackRect.left + track.scrollLeft,
      top: elRect.top - trackRect.top + track.scrollTop,
      width: elRect.width,
      height: elRect.height,
      ready: true,
    });
  }, [highlightKey]);

  useLayoutEffect(() => {
    measure();
  }, [measure, items, activeKey]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null;
    ro?.observe(track);
    for (const el of itemRefs.current.values()) ro?.observe(el);

    window.addEventListener("resize", measure);
    document.fonts?.ready.then(() => measure()).catch(() => undefined);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, items]);

  const setItemRef = useCallback(
    (key: string, node: HTMLElement | null) => {
      if (node) itemRefs.current.set(key, node);
      else itemRefs.current.delete(key);
      requestAnimationFrame(() => measure());
    },
    [measure]
  );

  return (
    <div
      ref={trackRef}
      role="navigation"
      aria-label={ariaLabel}
      onMouseLeave={() => setHoverKey(null)}
      className={cn(
        "relative isolate inline-flex w-fit max-w-full flex-nowrap items-center",
        // Allow horizontal scroll only when overflowing; don't steal taps.
        "overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "touch-pan-x",
        variant === "segmented" &&
          "gap-0.5 rounded-full border border-border/70 bg-muted/40 p-1",
        variant === "ghost" && "gap-0.5 rounded-full p-0.5",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "nav-pill-indicator pointer-events-none absolute top-0 left-0 rounded-full transition-[transform,width,height,opacity,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          variant === "segmented" &&
            "bg-background shadow-sm ring-1 ring-border/50",
          variant === "ghost" && "bg-foreground/[0.07]",
          hoveringOther &&
            variant === "segmented" &&
            "bg-foreground/[0.07] shadow-none ring-0",
          hoveringOther && variant === "ghost" && "bg-foreground/[0.05]",
          indicator.ready ? "opacity-100" : "opacity-0"
        )}
        style={{
          width: indicator.width,
          height: indicator.height,
          transform: `translate3d(${indicator.left}px, ${indicator.top}px, 0)`,
        }}
      />

      {items.map((item) => {
        const active = Boolean(item.active);
        const hovered = canFollowHover && hoverKey === item.key;
        const sharedClass = cn(
          "relative z-10 inline-flex shrink-0 items-center justify-center rounded-full font-medium transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "touch-manipulation select-none",
          // Icon-only (sm) and text (md) share h-8 so toolbars align.
          size === "sm" ? "size-8 text-xs" : "h-8 min-w-8 px-3.5 text-sm",
          active || hovered
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        );

        const hoverHandlers = canFollowHover
          ? {
              onMouseEnter: () => setHoverKey(item.key),
              onFocus: () => setHoverKey(item.key),
              onBlur: () =>
                setHoverKey((current) =>
                  current === item.key ? null : current
                ),
            }
          : {};

        if (item.onClick) {
          return (
            <button
              key={item.key}
              type="button"
              title={item.title}
              aria-label={item["aria-label"]}
              aria-pressed={active}
              onClick={item.onClick}
              ref={(node) => setItemRef(item.key, node)}
              className={sharedClass}
              {...hoverHandlers}
            >
              {item.label}
            </button>
          );
        }

        if (item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              scroll={false}
              title={item.title}
              aria-label={item["aria-label"]}
              aria-current={active ? "page" : undefined}
              ref={(node) => setItemRef(item.key, node)}
              className={sharedClass}
              {...hoverHandlers}
            >
              {item.label}
            </Link>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            title={item.title}
            aria-label={item["aria-label"]}
            aria-pressed={active}
            ref={(node) => setItemRef(item.key, node)}
            className={sharedClass}
            {...hoverHandlers}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
