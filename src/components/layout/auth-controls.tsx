"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";

import { AccountMenu } from "@/components/layout/account-menu";
import { WriteButton } from "@/components/writing/write-button";
import { Button } from "@/components/ui/button";
import { isClerkPublishableConfigured } from "@/lib/clerk";

/** Inverse CTA — dark on light, light on dark. */
const joinBtnClass =
  "h-8 border-0 bg-foreground px-2.5 text-sm text-background hover:bg-foreground/90 hover:text-background";

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
        size="sm"
        className={joinBtnClass}
        render={<Link href="/sign-up" />}
        nativeButton={false}
      >
        Join
      </Button>
    </div>
  );
}

function SignedInControls({
  profileAvatarUrl,
  profileXHandle,
}: {
  profileAvatarUrl?: string | null;
  profileXHandle?: string | null;
}) {
  return (
    <div className="flex h-8 items-center gap-1.5">
      <WriteButton />
      <AccountMenu
        profileAvatarUrl={profileAvatarUrl}
        profileXHandle={profileXHandle}
      />
    </div>
  );
}

function ClerkAuthControls({
  profileAvatarUrl,
  profileXHandle,
}: {
  profileAvatarUrl?: string | null;
  profileXHandle?: string | null;
}) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex size-8 items-center justify-center" aria-hidden>
        <span className="size-8 rounded-full bg-muted/60" />
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <SignedInControls
        profileAvatarUrl={profileAvatarUrl}
        profileXHandle={profileXHandle}
      />
    );
  }

  return (
    <div className="flex h-8 items-center gap-1">
      <SignInButton mode="modal">
        <Button variant="ghost" size="sm" className="h-8 px-2.5 text-sm">
          Sign in
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button size="sm" className={joinBtnClass}>
          Join
        </Button>
      </SignUpButton>
    </div>
  );
}

export function AuthControls({
  profileAvatarUrl,
  profileXHandle,
}: {
  profileAvatarUrl?: string | null;
  profileXHandle?: string | null;
} = {}) {
  if (!isClerkPublishableConfigured()) {
    return <GuestAuthLinks />;
  }
  return (
    <ClerkAuthControls
      profileAvatarUrl={profileAvatarUrl}
      profileXHandle={profileXHandle}
    />
  );
}
