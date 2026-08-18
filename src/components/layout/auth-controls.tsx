"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

import { WriteButton } from "@/components/writing/write-button";
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
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "rounded-full bg-foreground/[0.06] px-3 py-1.5 text-sm text-foreground transition-colors"
                : "rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </Show>
  );
}
