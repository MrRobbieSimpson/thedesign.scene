"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

import { WriteButton } from "@/components/writing/write-button";
import { AnimatedPills } from "@/components/ui/animated-pills";
import { Button } from "@/components/ui/button";
import { isClerkPublishableConfigured } from "@/lib/clerk";

function GuestAuthLinks() {
  return (
    <div className="flex h-7 items-center gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        className="h-7"
        render={<Link href="/sign-in" />}
        nativeButton={false}
      >
        Sign in
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7"
        render={<Link href="/sign-up" />}
        nativeButton={false}
      >
        Register
      </Button>
    </div>
  );
}

/**
 * Always show Sign in / Register for guests.
 * Prefer Clerk modal buttons once hydrated; fall back to routes.
 */
export function AuthControls() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!isClerkPublishableConfigured() || !ready) {
    return <GuestAuthLinks />;
  }

  return (
    <>
      <Show when="signed-out" fallback={<GuestAuthLinks />}>
        <div className="flex h-7 items-center gap-1.5">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" className="h-7">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="outline" size="sm" className="h-7">
              Register
            </Button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <div className="flex h-7 items-center gap-1.5">
          <WriteButton />
          <UserButton
            appearance={{
              elements: {
                rootBox: "flex h-7 items-center",
                avatarBox: "size-7",
              },
            }}
          />
        </div>
      </Show>
    </>
  );
}

export function SignedInNav({
  items,
  pathname,
}: {
  items: { href: string; label: string }[];
  pathname: string;
}) {
  if (!isClerkPublishableConfigured()) return null;

  return (
    <Show when="signed-in">
      <AnimatedPills
        variant="ghost"
        aria-label="Account"
        items={items.map((item) => ({
          key: item.href,
          label: item.label,
          href: item.href,
          active: pathname.startsWith(item.href),
        }))}
      />
    </Show>
  );
}
