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

const nav = [
  { href: "/", label: "Feed" },
  { href: "/events", label: "Events" },
];

const signedInNav = [
  { href: "/drafts", label: "Drafts" },
  { href: "/saves", label: "Saves" },
  { href: "/scenes", label: "Scenes" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-5 lg:gap-8">
          <Link href="/" className="group flex h-7 shrink-0 items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-[0.65rem] font-semibold tracking-tight text-background transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-active:scale-[0.97]">
              td
            </span>
            <span className="font-sans text-lg font-medium leading-none tracking-tight transition-opacity duration-300 group-hover:opacity-80 sm:text-xl">
              thedesign.scene
            </span>
          </Link>

          <nav className="hidden h-7 items-center gap-1 md:flex">
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

        <div className="flex h-7 shrink-0 items-center gap-2">
          <LocalTime />
          <ThemeToggle />
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
