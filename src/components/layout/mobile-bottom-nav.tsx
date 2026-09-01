"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, CalendarDays, Newspaper } from "lucide-react";

import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Feed", icon: Newspaper },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
] as const;

/**
 * Mobile-only primary nav — fixed bottom bar.
 * Desktop keeps Feed / Events / Jobs in the header.
 */
export function MobileBottomNav({ openJobCount = 0 }: { openJobCount?: number }) {
  const pathname = usePathname();

  return (
    <nav
      data-mobile-nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 md:hidden",
        "border-t border-border/60 bg-background/90 backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-stretch px-2">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" || pathname.startsWith("/article") || pathname.startsWith("/content")
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={
                item.href === "/jobs" && openJobCount > 0
                  ? `Jobs, ${openJobCount} open`
                  : item.label
              }
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5",
                "text-[11px] font-medium tracking-tight transition-colors",
                "touch-manipulation select-none",
                active
                  ? "text-foreground"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <span className="relative inline-flex">
                <Icon
                  className={cn(
                    "size-[1.15rem] stroke-[1.75]",
                    active ? "opacity-100" : "opacity-80"
                  )}
                  aria-hidden
                />
                {item.href === "/jobs" && openJobCount > 0 ? (
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-2.5 inline-flex h-4 min-w-4 items-center justify-center",
                      "rounded-full bg-foreground px-1 text-[9px] font-semibold tabular-nums leading-none text-background"
                    )}
                    aria-hidden
                  >
                    {openJobCount > 99 ? "99+" : openJobCount}
                  </span>
                ) : null}
              </span>
              <span>{item.label}</span>
              {active ? (
                <span
                  aria-hidden
                  className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-foreground/80"
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
