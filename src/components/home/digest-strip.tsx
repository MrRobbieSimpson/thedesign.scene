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
    <section className="rounded-2xl bg-foreground px-4 py-5 text-background sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1 sm:max-w-[18rem]">
          <h2 className="font-heading text-lg tracking-tight text-background sm:text-xl">
            Digest
          </h2>
          <p className="text-sm leading-relaxed text-background/70">
            A short Thursday note — picks, writing, and events near you.
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:max-w-xs sm:items-end">
          {action}
        </div>
      </div>

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
        <p className="mt-3 text-xs text-background/55">
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

  const action = !isLoaded ? (
    <div className="h-9 w-28 animate-pulse rounded-lg bg-background/20" />
  ) : isSignedIn ? (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      onClick={onSubscribe}
      className="h-9 border border-background/20 bg-background px-4 text-foreground hover:bg-background/90"
    >
      {pending ? "…" : "Join the digest"}
    </Button>
  ) : (
    <SignInButton mode="modal">
      <Button
        type="button"
        size="sm"
        className="h-9 border border-background/20 bg-background px-4 text-foreground hover:bg-background/90"
      >
        Sign in to join
      </Button>
    </SignInButton>
  );

  return <DigestShell action={action} message={message} error={error} />;
}

export function DigestStrip() {
  if (!isClerkPublishableConfigured()) {
    return (
      <DigestShell
        action={
          <Button
            type="button"
            size="sm"
            className="h-9 border border-background/20 bg-background px-4 text-foreground"
            render={<Link href="/sign-in" />}
            nativeButton={false}
          >
            Sign in to join
          </Button>
        }
        message={null}
        error={false}
      />
    );
  }

  return <DigestStripAuthed />;
}
