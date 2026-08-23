"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Show, SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";

import { checkIsAdmin } from "@/app/actions/admin-access";
import { AccountMenu } from "@/components/layout/account-menu";
import { WriteButton } from "@/components/writing/write-button";
import { AnimatedPills } from "@/components/ui/animated-pills";
import { Button } from "@/components/ui/button";
import { isClerkPublishableConfigured } from "@/lib/clerk";

function GuestAuthLinks() {
  return (
    <div className="flex h-8 items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2.5 text-sm"
        render={<Link href="/sign-in" />}
        nativeButton={false}
      >
        Sign in
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2.5 text-sm"
        render={<Link href="/sign-up" />}
        nativeButton={false}
      >
        <span className="sm:hidden">Join</span>
        <span className="hidden sm:inline">Register</span>
      </Button>
    </div>
  );
}

function SignedInControls() {
  return (
    <div className="flex h-8 items-center gap-1.5">
      <WriteButton />
      <AccountMenu />
    </div>
  );
}

function ClerkAuthControls() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex size-8 items-center justify-center" aria-hidden>
        <span className="size-8 rounded-full bg-muted/60" />
      </div>
    );
  }

  if (isSignedIn) {
    return <SignedInControls />;
  }

  return (
    <div className="flex h-8 items-center gap-1">
      <SignInButton mode="modal">
        <Button variant="ghost" size="sm" className="h-8 px-2.5 text-sm">
          Sign in
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button variant="outline" size="sm" className="h-8 px-2.5 text-sm">
          <span className="sm:hidden">Join</span>
          <span className="hidden sm:inline">Register</span>
        </Button>
      </SignUpButton>
    </div>
  );
}

export function AuthControls() {
  if (!isClerkPublishableConfigured()) {
    return <GuestAuthLinks />;
  }
  return <ClerkAuthControls />;
}

export function SignedInNav({
  items,
  pathname,
}: {
  items: { href: string; label: string }[];
  pathname: string;
}) {
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    checkIsAdmin().then((value) => {
      if (active) setAdmin(value);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!isClerkPublishableConfigured()) return null;

  const navItems = admin
    ? [...items, { href: "/admin", label: "Admin" }]
    : items;

  return (
    <Show when="signed-in">
      <AnimatedPills
        variant="ghost"
        aria-label="Account"
        items={navItems.map((item) => ({
          key: item.href,
          label: item.label,
          href: item.href,
          active: pathname.startsWith(item.href),
        }))}
      />
    </Show>
  );
}
