"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Feed" },
  { href: "/events", label: "Events" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-[0.65rem] font-semibold tracking-tight text-background transition-transform group-hover:scale-[1.03]">
              td
            </span>
            <span className="font-heading text-lg tracking-tight sm:text-xl">
              thedesign.scene
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
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
                    "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-foreground/[0.06] text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/admin"
            className="mr-1 hidden rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Admin
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
