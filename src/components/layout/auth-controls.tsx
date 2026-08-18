"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

import { WriteButton } from "@/components/writing/write-button";
import { AnimatedPills } from "@/components/ui/animated-pills";
import { Button } from "@/components/ui/button";
import { isClerkPublishableConfigured } from "@/lib/clerk";

/**
 * Clerk-powered auth UI. When keys aren't configured, show a quiet
 * Sign-in affordance that won't crash the header.
 */
export function AuthControls() {
  if (!isClerkPublishableConfigured()) {
    return (
      <Button
        variant="outline"
        size="sm"
        render={<Link href="/sign-in" />}
        nativeButton={false}
      >
        Sign in
      </Button>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="outline" size="sm">
            Sign in
          </Button>
        </SignInButton>
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
