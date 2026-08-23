"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { SignInButton, useAuth } from "@clerk/nextjs";

import { subscribeToDigest } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { isClerkPublishableConfigured } from "@/lib/clerk";

function DigestShell({
  action,
  message,
  error,
}: {
  action: React.ReactNode;
  message: string | null;
  error: boolean;
}) {
  return (
    <section className="rounded-2xl bg-foreground px-4 py-5 text-background sm:px-5">
      {/* Title + CTA on one aligned row; copy stacks cleanly below. */}
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 flex-1 font-heading text-lg tracking-tight text-background sm:text-xl">
          Digest
        </h2>
        <div className="shrink-0">{action}</div>
      </div>

      <p className="mt-2 max-w-prose text-sm leading-relaxed text-background/70">
        A short Thursday note — picks, writing, and events near you.
      </p>

      {message ? (
        <p
          className={
            error
              ? "mt-3 text-sm text-red-300 dark:text-red-700"
              : "mt-3 text-sm text-background/75"
          }
        >
          {message}
          {!error && message.toLowerCase().includes("location") ? (
            <>
              {" "}
              <Link
                href="/settings/profile"
                className="underline underline-offset-4"
              >
                Edit profile
              </Link>
            </>
          ) : null}
        </p>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-background/55">
          Uses your profile location for nearby events.{" "}
          <Link
            href="/settings/profile"
            className="text-background underline-offset-4 hover:underline"
          >
            Set location
          </Link>
          .
        </p>
      )}
    </section>
  );
}

function DigestCta({
  pending,
  onSubscribe,
  signedIn,
  loaded,
}: {
  pending: boolean;
  onSubscribe: () => void;
  signedIn: boolean;
  loaded: boolean;
}) {
  const className =
    "h-9 shrink-0 border border-background/20 bg-background px-3.5 text-foreground hover:bg-background/90 sm:px-4";

  if (!loaded) {
    return (
      <div className="h-9 w-[4.5rem] animate-pulse rounded-lg bg-background/20" />
    );
  }

  if (signedIn) {
    return (
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={onSubscribe}
        className={className}
      >
        {pending ? "…" : (
          <>
            <span className="sm:hidden">Join</span>
            <span className="hidden sm:inline">Join the digest</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <SignInButton mode="modal">
      <Button type="button" size="sm" className={className}>
        <span className="sm:hidden">Join</span>
        <span className="hidden sm:inline">Sign in to join</span>
      </Button>
    </SignInButton>
  );
}

function DigestStripAuthed() {
  const { isSignedIn, isLoaded } = useAuth();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  function onSubscribe() {
    setMessage(null);
    startTransition(async () => {
      const result = await subscribeToDigest();
      setError(!result.ok);
      setMessage(result.message);
    });
  }

  return (
    <DigestShell
      action={
        <DigestCta
          pending={pending}
          onSubscribe={onSubscribe}
          signedIn={Boolean(isSignedIn)}
          loaded={isLoaded}
        />
      }
      message={message}
      error={error}
    />
  );
}

export function DigestStrip() {
  if (!isClerkPublishableConfigured()) {
    return (
      <DigestShell
        action={
          <Button
            type="button"
            size="sm"
            className="h-9 shrink-0 border border-background/20 bg-background px-3.5 text-foreground sm:px-4"
            render={<Link href="/sign-in" />}
            nativeButton={false}
          >
            <span className="sm:hidden">Join</span>
            <span className="hidden sm:inline">Sign in to join</span>
          </Button>
        }
        message={null}
        error={false}
      />
    );
  }

  return <DigestStripAuthed />;
}
