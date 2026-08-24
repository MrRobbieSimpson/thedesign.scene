"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AuthControls } from "@/components/layout/auth-controls";
import { LocalTime } from "@/components/layout/local-time";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatedPills } from "@/components/ui/animated-pills";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Feed" },
  { href: "/events", label: "Events" },
];

export function Header({ timeZone }: { timeZone?: string | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      {/*
        On small screens match the home column (45rem + px-5) so Feed/Events
        lines up with Digest / filters. Wider shell from sm up for other pages.
      */}
      <div className="mx-auto w-full max-w-[45rem] px-5 sm:max-w-6xl sm:px-6">
        <div className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-8">
            <Link
              href="/"
              className="group flex h-8 min-w-0 max-w-full items-center gap-2 sm:gap-2.5"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-[0.65rem] font-semibold tracking-tight text-background transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-active:scale-[0.97]">
                sw
              </span>
              <span className="truncate font-sans text-[0.95rem] font-medium leading-none tracking-tight transition-opacity duration-300 group-hover:opacity-80 sm:text-lg md:text-xl">
                sit with design
              </span>
            </Link>

            <nav className="hidden h-8 items-center gap-1 md:flex">
              <AnimatedPills
                variant="ghost"
                aria-label="Primary"
                items={nav.map((item) => ({
                  key: item.href,
                  label: item.label,
                  href: item.href,
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
            <AuthControls />
          </div>
        </div>

        <nav
          className="flex h-11 items-center gap-1.5 border-t border-border/40 md:hidden"
          aria-label="Primary"
        >
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-8 flex-1 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  active
                    ? "bg-foreground/[0.07] text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
