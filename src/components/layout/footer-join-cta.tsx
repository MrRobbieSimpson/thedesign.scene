"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignUpButton, useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { isClerkPublishableConfigured } from "@/lib/clerk";
import { DIGEST_SUBSCRIBED_STORAGE_KEY } from "@/lib/digest-subscription-client";

const primaryBtnClass =
  "h-9 w-full border border-border/70 bg-transparent px-4 text-sm font-medium text-foreground hover:bg-muted/50 sm:w-auto";

const linkBtnClass =
  "h-9 w-full px-3.5 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground sm:w-auto";

/**
 * Footer signup nudge — flat on paper (no dark card), like the calm lockup.
 * Adjusts when the visitor is already on the Thursday digest.
 */
export function FooterJoinCta({
  subscribedToDigest = false,
}: {
  subscribedToDigest?: boolean;
}) {
  const clerkReady = isClerkPublishableConfigured();
  const [localSubscribed, setLocalSubscribed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(DIGEST_SUBSCRIBED_STORAGE_KEY) === "1") {
        setLocalSubscribed(true);
      }
    } catch {
      /* ignore */
    }

    function onSubscribed() {
      setLocalSubscribed(true);
    }
    window.addEventListener("tds:digest-subscribed", onSubscribed);
    return () =>
      window.removeEventListener("tds:digest-subscribed", onSubscribed);
  }, []);

  const onDigest = subscribedToDigest || localSubscribed;

  return (
    <section className="space-y-4">
      <div className="min-w-0 space-y-2">
        <h2 className="font-heading text-2xl tracking-tight text-foreground sm:text-3xl">
          sit with design
        </h2>
        {clerkReady ? (
          <FooterCopyClerk onDigest={onDigest} />
        ) : (
          <FooterCopyStatic onDigest={onDigest} />
        )}
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        {clerkReady ? (
          <FooterAuthActionsClerk onDigest={onDigest} />
        ) : (
          <FooterAuthActionsStatic onDigest={onDigest} />
        )}
      </div>
    </section>
  );
}

function FooterCopyStatic({ onDigest }: { onDigest: boolean }) {
  return (
    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
      {onDigest
        ? "You’re on the Thursday digest. Join to save work and set a location for nearby events."
        : "Join to save what resonates — and get the Thursday digest."}
    </p>
  );
}

function FooterCopyClerk({ onDigest }: { onDigest: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {onDigest
          ? "You’re on the Thursday digest."
          : "Join to save what resonates — and get the Thursday digest."}
      </p>
    );
  }

  if (onDigest && isSignedIn) {
    return (
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        You’re on the Thursday digest. Add a location for nearby events.
      </p>
    );
  }

  if (onDigest) {
    return (
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        You’re on the Thursday digest. Join to save work and set a location for
        nearby events.
      </p>
    );
  }

  if (isSignedIn) {
    return (
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Get the Thursday digest — picks, writing, and a few events near you.
      </p>
    );
  }

  return (
    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
      Join to save what resonates — and get the Thursday digest.
    </p>
  );
}

function FooterAuthActionsStatic({ onDigest }: { onDigest: boolean }) {
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className={primaryBtnClass}
        render={<Link href="/sign-up" />}
        nativeButton={false}
      >
        Join
      </Button>
      {!onDigest ? (
        <Button
          size="sm"
          variant="ghost"
          className={linkBtnClass}
          render={<Link href="/subscribe" />}
          nativeButton={false}
        >
          Get the digest
        </Button>
      ) : null}
    </>
  );
}

function FooterAuthActionsClerk({ onDigest }: { onDigest: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div
        className="h-9 w-full animate-pulse rounded-lg bg-muted/60 sm:w-40"
        aria-hidden
      />
    );
  }

  if (isSignedIn && onDigest) {
    return (
      <Button
        size="sm"
        variant="outline"
        className={primaryBtnClass}
        render={<Link href="/settings/profile" />}
        nativeButton={false}
      >
        Update location
      </Button>
    );
  }

  if (isSignedIn) {
    return (
      <Button
        size="sm"
        variant="outline"
        className={primaryBtnClass}
        render={<Link href="/subscribe" />}
        nativeButton={false}
      >
        Get the digest
      </Button>
    );
  }

  if (onDigest) {
    return (
      <SignUpButton mode="modal">
        <Button size="sm" variant="outline" className={primaryBtnClass}>
          Join
        </Button>
      </SignUpButton>
    );
  }

  return (
    <>
      <SignUpButton mode="modal">
        <Button size="sm" variant="outline" className={primaryBtnClass}>
          Join
        </Button>
      </SignUpButton>
      <Button
        size="sm"
        variant="ghost"
        className={linkBtnClass}
        render={<Link href="/subscribe" />}
        nativeButton={false}
      >
        Get the digest
      </Button>
    </>
  );
}
