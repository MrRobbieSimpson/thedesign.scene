"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Briefcase, CalendarDays, Newspaper } from "lucide-react";

import { useWriting } from "@/components/writing/writing-context";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Feed", icon: Newspaper, match: "feed" as const },
  {
    href: "/events",
    label: "Events",
    icon: CalendarDays,
    match: "events" as const,
  },
  { href: "/jobs", label: "Jobs", icon: Briefcase, match: "jobs" as const },
] as const;

type NavMatch = (typeof nav)[number]["match"];

function matchFromPath(pathname: string): NavMatch {
  if (pathname.startsWith("/events")) return "events";
  if (pathname.startsWith("/jobs")) return "jobs";
  return "feed";
}

type Indicator = {
  left: number;
  width: number;
  ready: boolean;
};

/**
 * Mobile-only primary nav — premium glass bar with a liquid sliding pill.
 */
export function MobileBottomNav({
  openJobCount = 0,
}: {
  openJobCount?: number;
}) {
  const pathname = usePathname();
  const active = matchFromPath(pathname);
  const { open: writingOpen, visible: writingVisible } = useWriting();
  const [mounted, setMounted] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const [indicator, setIndicator] = useState<Indicator>({
    left: 0,
    width: 0,
    ready: false,
  });
  const [traveling, setTraveling] = useState(false);
  const prevActive = useRef(active);

  useEffect(() => {
    setMounted(true);
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const el = itemRefs.current.get(active);
    if (!track || !el) {
      setIndicator((current) => ({ ...current, ready: false }));
      return;
    }
    const trackRect = track.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({
      left: elRect.left - trackRect.left,
      width: elRect.width,
      ready: true,
    });
  }, [active]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (prevActive.current !== active) {
      setTraveling(true);
      prevActive.current = active;
      const id = window.setTimeout(() => setTraveling(false), 480);
      return () => window.clearTimeout(id);
    }
  }, [active]);

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
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const setItemRef = useCallback(
    (key: string, node: HTMLElement | null) => {
      if (node) itemRefs.current.set(key, node);
      else itemRefs.current.delete(key);
      requestAnimationFrame(() => measure());
    },
    [measure]
  );

  if (!mounted || (writingOpen && writingVisible)) return null;

  return createPortal(
    <nav
      data-mobile-nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[60] md:hidden",
        "border-t border-border/50 bg-background/85 backdrop-blur-2xl",
        "shadow-[0_-12px_40px_-28px_rgba(0,0,0,0.45)]",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div
        ref={trackRef}
        className="relative mx-auto flex h-[3.75rem] max-w-6xl items-stretch px-2"
      >
        {/* Liquid pill — slides + gently stretches while traveling */}
        <span
          aria-hidden
          className={cn(
            "mobile-nav-liquid pointer-events-none absolute top-1.5 bottom-1.5 z-0 rounded-[1.15rem]",
            "bg-foreground/[0.07] ring-1 ring-inset ring-foreground/[0.06]",
            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
            indicator.ready ? "opacity-100" : "opacity-0",
            traveling && "mobile-nav-liquid--travel"
          )}
          style={{
            width: indicator.width,
            transform: `translate3d(${indicator.left}px, 0, 0)`,
          }}
        />

        {nav.map((item) => {
          const isActive = active === item.match;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              ref={(node) => setItemRef(item.match, node)}
              aria-current={isActive ? "page" : undefined}
              aria-label={
                item.href === "/jobs" && openJobCount > 0
                  ? `Jobs, ${openJobCount} open`
                  : item.label
              }
              className={cn(
                "relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5",
                "text-[10px] font-medium tracking-[0.04em] uppercase",
                "touch-manipulation select-none",
                "transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground/75 active:text-foreground/90"
              )}
            >
              <span className="relative inline-flex">
                <Icon
                  className={cn(
                    "size-[1.2rem] stroke-[1.6] transition-transform duration-500",
                    "ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
                    isActive
                      ? "scale-110 -translate-y-px opacity-100"
                      : "scale-100 opacity-70"
                  )}
                  aria-hidden
                />
                {item.href === "/jobs" && openJobCount > 0 ? (
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-2.5 inline-flex h-3.5 min-w-3.5 items-center justify-center",
                      "rounded-full bg-foreground px-1 text-[8px] font-semibold tabular-nums leading-none text-background"
                    )}
                    aria-hidden
                  >
                    {openJobCount > 99 ? "99+" : openJobCount}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isActive ? "opacity-100" : "opacity-70"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>,
    document.body
  );
}
