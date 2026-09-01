"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Briefcase,
  LayoutGrid,
  PanelsTopLeft,
  RectangleHorizontal,
  Ticket,
} from "lucide-react";

import { useFeedLayoutOptional } from "@/components/content/feed-layout-context";
import type { FeedLayout } from "@/components/content/feed-layout";
import { useWriting } from "@/components/writing/writing-context";
import { resolveFeedFilter } from "@/lib/feed-mix";
import { cn } from "@/lib/utils";

type NavKey = "articles" | "visuals" | "events" | "jobs";

const tabs: {
  key: NavKey;
  label: string;
  shortLabel: string;
  href: string;
  icon: typeof BookOpen;
}[] = [
  {
    key: "articles",
    label: "Writing",
    shortLabel: "Write",
    href: "/",
    icon: BookOpen,
  },
  {
    key: "visuals",
    label: "Visuals",
    shortLabel: "Visual",
    href: "/?type=visuals",
    icon: PanelsTopLeft,
  },
  {
    key: "events",
    label: "Events",
    shortLabel: "Events",
    href: "/?type=events",
    icon: Ticket,
  },
  {
    key: "jobs",
    label: "Jobs",
    shortLabel: "Jobs",
    href: "/jobs",
    icon: Briefcase,
  },
];

const layoutOptions: {
  value: Extract<FeedLayout, "big" | "small">;
  label: string;
  icon: typeof LayoutGrid;
}[] = [
  { value: "big", label: "Big cards", icon: RectangleHorizontal },
  { value: "small", label: "Small cards", icon: LayoutGrid },
];

type Indicator = { left: number; width: number; ready: boolean };

function activeNavKey(pathname: string, typeParam: string | null): NavKey {
  if (pathname.startsWith("/jobs")) return "jobs";
  if (pathname.startsWith("/events")) return "events";
  if (pathname === "/") {
    const filter = resolveFeedFilter(typeParam);
    if (filter === "visuals") return "visuals";
    if (filter === "events") return "events";
    return "articles";
  }
  return "articles";
}

/**
 * Figma floating chrome — glass capsule (Writing / Visuals / Events / Jobs)
 * + two layout circles. Inset from edges, not a full-bleed dock.
 */
export function MobileBottomNav({
  openJobCount = 0,
}: {
  openJobCount?: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const feedLayout = useFeedLayoutOptional();
  const { open: writingOpen, visible: writingVisible } = useWriting();
  const [mounted, setMounted] = useState(false);

  const active = activeNavKey(pathname, searchParams.get("type"));
  const layoutEnabled =
    pathname === "/" && active !== "visuals" && Boolean(feedLayout);

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

  const activeLayout =
    feedLayout?.layout === "mosaic" ? "small" : feedLayout?.layout ?? "big";

  return createPortal(
    <div
      data-mobile-nav
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-[60] md:hidden",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      )}
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-6xl items-center gap-2 px-3">
        {/* Glass capsule */}
        <nav
          aria-label="Primary"
          className={cn(
            "relative flex h-12 min-w-0 flex-1 items-center",
            "rounded-full border border-[rgba(238,234,227,0.2)]",
            "bg-[rgba(30,25,22,0.45)] backdrop-blur-[6px]",
            "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55)]",
            "px-1"
          )}
        >
          <div
            ref={trackRef}
            className="relative flex h-full w-full items-center"
          >
            <span
              aria-hidden
              className={cn(
                "mobile-nav-liquid pointer-events-none absolute top-1 bottom-1 z-0 rounded-full",
                "bg-white/10",
                indicator.ready ? "opacity-100" : "opacity-0",
                traveling && "mobile-nav-liquid--travel"
              )}
              style={{
                width: indicator.width,
                transform: `translate3d(${indicator.left}px, 0, 0)`,
              }}
            />

            {tabs.map((tab) => {
              const isActive = active === tab.key;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  prefetch
                  ref={(node) => setItemRef(tab.key, node)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={
                    tab.key === "jobs" && openJobCount > 0
                      ? `Jobs, ${openJobCount} open`
                      : tab.label
                  }
                  className={cn(
                    "relative z-10 flex h-9 min-w-0 flex-1 items-center justify-center gap-0.5 rounded-full px-0.5",
                    "text-[11px] font-normal tracking-tight text-white sm:gap-1 sm:text-[12px]",
                    "touch-manipulation select-none",
                    "transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isActive ? "opacity-100" : "opacity-70 active:opacity-100"
                  )}
                >
                  <span className="relative inline-flex shrink-0">
                    <Icon className="size-3.5 stroke-[1.5] sm:size-4" aria-hidden />
                    {tab.key === "jobs" && openJobCount > 0 ? (
                      <span
                        className={cn(
                          "absolute -top-1.5 -right-2 inline-flex h-3.5 min-w-3.5 items-center justify-center",
                          "rounded-full bg-white px-0.5 text-[8px] font-semibold tabular-nums leading-none text-[rgba(30,25,22,0.9)]"
                        )}
                        aria-hidden
                      >
                        {openJobCount > 99 ? "99+" : openJobCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate">{tab.shortLabel}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Layout circles */}
        <div
          className="flex shrink-0 items-center gap-1.5"
          role="group"
          aria-label="Feed layout"
        >
          {layoutOptions.map((option) => {
            const Icon = option.icon;
            const isActive = layoutEnabled && activeLayout === option.value;
            return (
              <button
                key={option.value}
                type="button"
                title={option.label}
                aria-label={option.label}
                aria-pressed={isActive}
                disabled={!layoutEnabled}
                onClick={() => feedLayout?.setLayout(option.value)}
                className={cn(
                  "inline-flex size-12 shrink-0 items-center justify-center rounded-full",
                  "border border-[rgba(238,234,227,0.2)] backdrop-blur-[6px]",
                  "touch-manipulation transition-all duration-300",
                  "ease-[cubic-bezier(0.22,1,0.36,1)]",
                  "disabled:pointer-events-none disabled:opacity-40",
                  "shadow-[0_8px_28px_-14px_rgba(0,0,0,0.5)]",
                  isActive
                    ? "bg-[rgba(255,255,255,0.45)] text-foreground"
                    : "bg-[rgba(30,25,22,0.45)] text-white"
                )}
              >
                <Icon className="size-4 stroke-[1.5]" aria-hidden />
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
