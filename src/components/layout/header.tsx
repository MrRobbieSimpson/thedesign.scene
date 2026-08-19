"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  AuthControls,
  SignedInNav,
} from "@/components/layout/auth-controls";
import { LocalTime } from "@/components/layout/local-time";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatedPills } from "@/components/ui/animated-pills";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Feed" },
  { href: "/events", label: "Events" },
];

const signedInNav = [
  { href: "/drafts", label: "Drafts" },
  { href: "/saves", label: "Saves" },
  { href: "/scenes", label: "Scenes" },
  { href: "/settings/profile", label: "Profile" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Primary bar — logo + actions always on one aligned row */}
        <div className="flex h-14 items-center justify-between gap-3 sm:h-16">
          <div className="flex min-w-0 items-center gap-4 lg:gap-8">
            <Link
              href="/"
              className="group flex h-8 shrink-0 items-center gap-2.5"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-[0.65rem] font-semibold tracking-tight text-background transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-active:scale-[0.97]">
                td
              </span>
              <span className="truncate font-sans text-base font-medium leading-none tracking-tight transition-opacity duration-300 group-hover:opacity-80 sm:text-lg md:text-xl">
                thedesign.scene
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
              <SignedInNav items={signedInNav} pathname={pathname} />
            </nav>
          </div>

          <div className="flex h-8 shrink-0 items-center gap-1 sm:gap-1.5">
            <LocalTime />
            <ThemeToggle />
            <AuthControls />
          </div>
        </div>

        {/* Mobile nav — second row, full-width aligned pills */}
        <nav
          className="flex h-11 items-center gap-1 border-t border-border/40 md:hidden"
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
