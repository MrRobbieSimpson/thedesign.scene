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
  /** Visual density */
  size?: "sm" | "md";
  /** Softer track for header (no heavy border) */
  variant?: "segmented" | "ghost";
  /** When true, indicator follows hover; otherwise only selection */
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
  const [indicator, setIndicator] = useState<Indicator>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const activeKey = items.find((item) => item.active)?.key ?? null;
  const highlightKey = followHover && hoverKey ? hoverKey : activeKey;
  const hoveringOther = Boolean(
    followHover && hoverKey && hoverKey !== activeKey
  );

  const measure = useCallback(() => {
    const key = highlightKey;
    if (!key) {
      setIndicator((prev) => ({ ...prev, ready: false }));
      return;
    }
    const el = itemRefs.current.get(key);
    if (!el) return;
    setIndicator({
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
      ready: true,
    });
  }, [highlightKey]);

  useLayoutEffect(() => {
    measure();
  }, [measure, items]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(track);
    for (const el of itemRefs.current.values()) ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, items]);

  const setItemRef = useCallback((key: string, node: HTMLElement | null) => {
    if (node) itemRefs.current.set(key, node);
    else itemRefs.current.delete(key);
  }, []);

  return (
    <div
      ref={trackRef}
      role="navigation"
      aria-label={ariaLabel}
      onMouseLeave={() => setHoverKey(null)}
      className={cn(
        "relative inline-flex max-w-full flex-nowrap items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        variant === "segmented" &&
          "gap-0.5 rounded-full border border-border/70 bg-muted/40 p-1",
        variant === "ghost" && "gap-0.5 rounded-full p-0.5",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "nav-pill-indicator pointer-events-none absolute rounded-full transition-[transform,width,height,opacity,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          variant === "segmented" &&
            "bg-background shadow-sm ring-1 ring-border/50",
          variant === "ghost" && "bg-foreground/[0.07]",
          hoveringOther &&
            variant === "segmented" &&
            "bg-foreground/[0.06] shadow-none ring-0",
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
        const sharedClass = cn(
          "relative z-10 inline-flex items-center justify-center rounded-full font-medium transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          size === "sm" ? "size-8 text-xs" : "px-3.5 py-1.5 text-sm",
          active
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
          "active:scale-[0.97]"
        );

        const handlers = {
          onMouseEnter: () => setHoverKey(item.key),
          onFocus: () => setHoverKey(item.key),
          onBlur: () => setHoverKey((current) => (current === item.key ? null : current)),
        };

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
              {...handlers}
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
            onClick={item.onClick}
            ref={(node) => setItemRef(item.key, node)}
            className={sharedClass}
            {...handlers}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
