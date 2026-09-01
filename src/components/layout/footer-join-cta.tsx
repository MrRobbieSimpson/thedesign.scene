"use client";

import Link from "next/link";
import { SignUpButton, useAuth } from "@clerk/nextjs";

import { BrandMarkChip } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { isClerkPublishableConfigured } from "@/lib/clerk";
import { cn } from "@/lib/utils";

const joinBtnClass =
  "h-9 w-full border-0 bg-background px-4 text-sm font-medium text-foreground hover:bg-background/90 sm:w-auto";

const ghostBtnClass =
  "h-9 w-full px-3.5 text-sm text-background/80 hover:bg-background/10 hover:text-background sm:w-auto";

/**
 * Footer signup nudge — inverse paper bar (always visible).
 * Guests: Join + digest. Signed-in: digest.
 */
export function FooterJoinCta() {
  const clerkReady = isClerkPublishableConfigured();

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
            <FooterCopy clerkReady={clerkReady} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <FooterAuthActions clerkReady={clerkReady} />
        </div>
      </div>
    </section>
  );
}

function FooterCopy({ clerkReady }: { clerkReady: boolean }) {
  if (!clerkReady) {
    return (
      <p className="mt-1 text-sm leading-relaxed text-background/65">
        Join to save what resonates — and get the Thursday digest.
      </p>
    );
  }

  return <FooterCopyClerk />;
}

function FooterCopyClerk() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <p className="mt-1 text-sm leading-relaxed text-background/65">
        Join to save what resonates — and get the Thursday digest.
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

function FooterAuthActions({ clerkReady }: { clerkReady: boolean }) {
  if (!clerkReady) {
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

  return <FooterAuthActionsClerk />;
}

function FooterAuthActionsClerk() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div
        className="h-9 w-full animate-pulse rounded-lg bg-background/15 sm:w-40"
        aria-hidden
      />
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
