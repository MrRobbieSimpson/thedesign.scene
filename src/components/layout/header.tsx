"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMarkChip } from "@/components/brand/mark";
import { AuthControls } from "@/components/layout/auth-controls";
import { LocalTime } from "@/components/layout/local-time";
import { NavPrefetch } from "@/components/layout/nav-prefetch";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatedPills } from "@/components/ui/animated-pills";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Feed" },
  { href: "/events", label: "Events" },
  { href: "/jobs", label: "Jobs" },
] as const;

/** Soft count chip with a quiet shine — only when openings exist. */
function JobsCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "jobs-count-badge relative mr-1.5 inline-flex h-[1.125rem] min-w-[1.125rem]",
        "items-center justify-center overflow-hidden rounded-full px-1.5",
        "text-[10px] font-semibold tabular-nums leading-none tracking-tight",
        "bg-foreground/[0.09] text-foreground/80",
        "ring-1 ring-inset ring-foreground/[0.08]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]"
      )}
      aria-hidden
    >
      <span className="relative z-[1]">{count > 99 ? "99+" : count}</span>
    </span>
  );
}

function navLabel(href: string, label: string, openJobCount: number) {
  if (href !== "/jobs") return label;
  return (
    <span className="inline-flex items-center">
      <JobsCountBadge count={openJobCount} />
      {label}
    </span>
  );
}

export function Header({
  timeZone,
  openJobCount = 0,
  profileAvatarUrl = null,
  profileXHandle = null,
}: {
  timeZone?: string | null;
  openJobCount?: number;
  profileAvatarUrl?: string | null;
  profileXHandle?: string | null;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <NavPrefetch />
      {/* Full-width shell so the logo + Feed/Events/Jobs always fit. */}
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-8">
            <Link
              href="/"
              className="group flex h-8 min-w-0 max-w-[min(100%,14rem)] shrink items-center gap-2 sm:max-w-none sm:gap-2.5"
            >
              <BrandMarkChip />
              <span className="truncate font-sans text-[0.95rem] font-medium leading-none tracking-tight transition-opacity duration-300 group-hover:opacity-80 max-[360px]:hidden sm:text-lg md:text-xl">
                sit with design
              </span>
            </Link>

            <nav className="hidden h-8 items-center gap-1 md:flex">
              <AnimatedPills
                variant="ghost"
                aria-label="Primary"
                items={nav.map((item) => ({
                  key: item.href,
                  label: navLabel(item.href, item.label, openJobCount),
                  href: item.href,
                  "aria-label":
                    item.href === "/jobs" && openJobCount > 0
                      ? `Jobs, ${openJobCount} open`
                      : undefined,
                  active:
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href),
                }))}
              />
            </nav>
          </div>

          <div className="flex h-8 shrink-0 items-center gap-1 sm:gap-1.5">
            <LocalTime timeZone={timeZone} />
            <ThemeToggle />
            <AuthControls
              profileAvatarUrl={profileAvatarUrl}
              profileXHandle={profileXHandle}
            />
          </div>
        </div>
        {/* Mobile primary nav lives in MobileBottomNav — not duplicated up here. */}
      </div>
    </header>
  );
}
