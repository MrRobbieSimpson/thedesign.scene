"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

import { WriteButton } from "@/components/writing/write-button";
import { AnimatedPills } from "@/components/ui/animated-pills";
import { Button } from "@/components/ui/button";
import { isClerkPublishableConfigured } from "@/lib/clerk";

function GuestAuthLinks() {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/sign-in" />}
        nativeButton={false}
      >
        Sign in
      </Button>
      <Button
        variant="outline"
        size="sm"
        render={<Link href="/sign-up" />}
        nativeButton={false}
      >
        Register
      </Button>
    </div>
  );
}

/**
 * Clear Sign in / Register when signed out; write + avatar when signed in.
 */
export function AuthControls() {
  if (!isClerkPublishableConfigured()) {
    return <GuestAuthLinks />;
  }

  return (
    <>
      <Show when="signed-out">
        <div className="flex items-center gap-2">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="outline" size="sm">
              Register
            </Button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <WriteButton />
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-8",
            },
          }}
        />
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
