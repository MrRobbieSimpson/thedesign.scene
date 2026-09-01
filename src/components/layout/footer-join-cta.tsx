"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignUpButton, useAuth } from "@clerk/nextjs";

import { BrandMarkChip } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { isClerkPublishableConfigured } from "@/lib/clerk";
import { DIGEST_SUBSCRIBED_STORAGE_KEY } from "@/lib/digest-subscription";
import { cn } from "@/lib/utils";

const joinBtnClass =
  "h-9 w-full border-0 bg-background px-4 text-sm font-medium text-foreground hover:bg-background/90 sm:w-auto";

const ghostBtnClass =
  "h-9 w-full px-3.5 text-sm text-background/80 hover:bg-background/10 hover:text-background sm:w-auto";

/**
 * Footer signup nudge — inverse paper bar.
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
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-2xl bg-foreground px-4 py-4 text-background sm:px-5",
        "shadow-[0_20px_50px_-28px_rgba(0,0,0,0.55)]"
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <BrandMarkChip className="mt-0.5 size-8 shrink-0 rounded-lg bg-background p-[0.35rem] text-foreground [&_svg]:size-[1.05rem]" />
          <div className="min-w-0 flex-1">
            <p className="font-sans text-[0.95rem] font-medium tracking-tight text-background">
              sit with design
            </p>
            {clerkReady ? (
              <FooterCopyClerk onDigest={onDigest} />
            ) : (
              <FooterCopyStatic onDigest={onDigest} />
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          {clerkReady ? (
            <FooterAuthActionsClerk onDigest={onDigest} />
          ) : (
            <FooterAuthActionsStatic onDigest={onDigest} />
          )}
        </div>
      </div>
    </section>
  );
}

function FooterCopyStatic({ onDigest }: { onDigest: boolean }) {
  return (
    <p className="mt-1 text-sm leading-relaxed text-background/65">
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
      <p className="mt-1 text-sm leading-relaxed text-background/65">
        {onDigest
          ? "You’re on the Thursday digest."
          : "Join to save what resonates — and get the Thursday digest."}
      </p>
    );
  }

  if (onDigest && isSignedIn) {
    return (
      <p className="mt-1 text-sm leading-relaxed text-background/65">
        You’re on the Thursday digest. Add a location for nearby events.
      </p>
    );
  }

  if (onDigest) {
    return (
      <p className="mt-1 text-sm leading-relaxed text-background/65">
        You’re on the Thursday digest. Join to save work and set a location for
        nearby events.
      </p>
    );
  }

  if (isSignedIn) {
    return (
      <p className="mt-1 text-sm leading-relaxed text-background/65">
        Get the Thursday digest — picks, writing, and a few events near you.
      </p>
    );
  }

  return (
    <p className="mt-1 text-sm leading-relaxed text-background/65">
      Join to save what resonates — and get the Thursday digest.
    </p>
  );
}

function FooterAuthActionsStatic({ onDigest }: { onDigest: boolean }) {
  return (
    <>
      <Button
        size="sm"
        className={joinBtnClass}
        render={<Link href="/sign-up" />}
        nativeButton={false}
      >
        Join
      </Button>
      {!onDigest ? (
        <Button
          size="sm"
          variant="ghost"
          className={ghostBtnClass}
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
        className="h-9 w-full animate-pulse rounded-lg bg-background/15 sm:w-40"
        aria-hidden
      />
    );
  }

  if (isSignedIn && onDigest) {
    return (
      <Button
        size="sm"
        className={joinBtnClass}
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
        className={joinBtnClass}
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
        <Button size="sm" className={joinBtnClass}>
          Join
        </Button>
      </SignUpButton>
    );
  }

  return (
    <>
      <SignUpButton mode="modal">
        <Button size="sm" className={joinBtnClass}>
          Join
        </Button>
      </SignUpButton>
      <Button
        size="sm"
        variant="ghost"
        className={ghostBtnClass}
        render={<Link href="/subscribe" />}
        nativeButton={false}
      >
        Get the digest
      </Button>
    </>
  );
}
