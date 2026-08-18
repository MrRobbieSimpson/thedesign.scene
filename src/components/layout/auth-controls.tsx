"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";

import { WriteButton } from "@/components/writing/write-button";
import { AnimatedPills } from "@/components/ui/animated-pills";
import { Button } from "@/components/ui/button";
import { isClerkPublishableConfigured } from "@/lib/clerk";

function GuestAuthLinks() {
  return (
    <div className="flex h-7 items-center gap-1 sm:gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 sm:px-2.5"
        render={<Link href="/sign-in" />}
        nativeButton={false}
      >
        Sign in
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 sm:px-2.5"
        render={<Link href="/sign-up" />}
        nativeButton={false}
      >
        Register
      </Button>
    </div>
  );
}

function SignedInControls() {
  return (
    <div className="flex h-7 items-center gap-1.5">
      <WriteButton />
      <UserButton
        appearance={{
          elements: {
            rootBox: "flex h-7 w-7 items-center justify-center",
            avatarBox: "size-7",
          },
        }}
      />
    </div>
  );
}

function ClerkAuthControls() {
  const { isLoaded, isSignedIn } = useAuth();

  // Avoid flashing the wrong state while Clerk hydrates.
  if (!isLoaded) {
    return (
      <div className="flex h-7 w-8 items-center justify-center" aria-hidden>
        <span className="size-7 rounded-full bg-muted/60" />
      </div>
    );
  }

  if (isSignedIn) {
    return <SignedInControls />;
  }

  return (
    <div className="flex h-7 items-center gap-1 sm:gap-1.5">
      <SignInButton mode="modal">
        <Button variant="ghost" size="sm" className="h-7 px-2 sm:px-2.5">
          Sign in
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button variant="outline" size="sm" className="h-7 px-2 sm:px-2.5">
          Register
        </Button>
      </SignUpButton>
    </div>
  );
}

/**
 * Guest: Sign in / Register.
 * Signed in: Write + avatar only — never both.
 */
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
