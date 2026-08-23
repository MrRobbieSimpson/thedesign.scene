"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  Bookmark,
  FileText,
  LogOut,
  Pencil,
  Shield,
  UserRound,
} from "lucide-react";

import { checkIsAdmin } from "@/app/actions/admin-access";
import { cn } from "@/lib/utils";

const baseLinks = [
  { href: "/me", label: "Portfolio", icon: UserRound },
  { href: "/drafts", label: "Drafts", icon: FileText },
  { href: "/saves", label: "Saves", icon: Bookmark },
  { href: "/settings/profile", label: "Profile", icon: Pencil },
] as const;

/**
 * Scene-native account menu — primary signed-in links live here
 * so the header stays Feed / Events only.
 */
export function AccountMenu() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    let active = true;
    checkIsAdmin().then((value) => {
      if (active) setAdmin(value);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!isLoaded) {
    return <span className="size-8 rounded-full bg-muted/60" aria-hidden />;
  }

  if (!user) return null;

  const name =
    user.fullName ??
    user.firstName ??
    user.primaryEmailAddress?.emailAddress ??
    "Account";
  const email = user.primaryEmailAddress?.emailAddress ?? null;
  const imageUrl = user.imageUrl;
  const initial = name.replace("@", "").charAt(0).toUpperCase();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex size-8 items-center justify-center overflow-hidden rounded-full",
          "ring-1 ring-border/60 transition-[box-shadow,opacity]",
          "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            width={32}
            height={32}
            className="size-8 object-cover"
          />
        ) : (
          <span className="flex size-8 items-center justify-center bg-muted text-xs font-medium">
            {initial}
          </span>
        )}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute top-[calc(100%+0.5rem)] right-0 z-50 w-56 overflow-hidden",
            "rounded-2xl border border-border/60 bg-card py-1.5",
            "shadow-[0_20px_50px_-28px_rgba(0,0,0,0.55)]"
          )}
        >
          <div className="border-b border-border/50 px-3.5 py-3">
            <p className="truncate text-sm font-medium tracking-tight">
              {name}
            </p>
            {email ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {email}
              </p>
            ) : null}
          </div>

          <div className="py-1">
            {baseLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground/90 transition-colors hover:bg-muted/50"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  {item.label}
                </Link>
              );
            })}
            {admin ? (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground/90 transition-colors hover:bg-muted/50"
              >
                <Shield className="size-4 text-muted-foreground" />
                Admin
              </Link>
            ) : null}
          </div>

          <div className="border-t border-border/50 py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void signOut({ redirectUrl: "/" });
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-foreground/90 transition-colors hover:bg-muted/50"
            >
              <LogOut className="size-4 text-muted-foreground" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
