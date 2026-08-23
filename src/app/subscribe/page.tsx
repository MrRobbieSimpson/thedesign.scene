"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { SignInButton, useAuth } from "@clerk/nextjs";

import { subscribeToDigest } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { isClerkPublishableConfigured } from "@/lib/clerk";

function SubscribeBody({
  signedIn,
  loaded,
}: {
  signedIn: boolean;
  loaded: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const clerkReady = isClerkPublishableConfigured();

  function onSubscribe() {
    setMessage(null);
    startTransition(async () => {
      const result = await subscribeToDigest();
      setError(!result.ok);
      setMessage(result.message);
    });
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16 sm:py-24">
      <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Weekly digest
      </p>
      <h1 className="mt-3 font-heading text-4xl tracking-tight">
        Design worth sitting with — in your inbox.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        A short Thursday note: editor’s picks, new writing, and events near you.
        Sign in so we can use your profile location.
      </p>

      <div className="mt-10 space-y-4">
        {!loaded ? (
          <div className="h-9 w-40 animate-pulse rounded-lg bg-muted" />
        ) : signedIn ? (
          <Button type="button" disabled={pending} onClick={onSubscribe}>
            {pending ? "Subscribing…" : "Join the digest"}
          </Button>
        ) : clerkReady ? (
          <SignInButton mode="modal">
            <Button type="button">Sign in to join</Button>
          </SignInButton>
        ) : (
          <Button
            type="button"
            render={<Link href="/sign-in" />}
            nativeButton={false}
          >
            Sign in to join
          </Button>
        )}

        {message ? (
          <p
            className={
              error ? "text-sm text-destructive" : "text-sm text-muted-foreground"
            }
          >
            {message}{" "}
            {!error ? (
              <Link
                href="/settings/profile"
                className="underline-offset-4 hover:underline"
              >
                Profile settings
              </Link>
            ) : null}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tip: set your city on your{" "}
            <Link
              href="/settings/profile"
              className="underline-offset-4 hover:underline"
            >
              profile
            </Link>{" "}
            for local events.
          </p>
        )}
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Prefer the feed?{" "}
        <Link href="/" className="underline-offset-4 hover:underline">
          Back to the scene
        </Link>
        .
      </p>
    </div>
  );
}

function SubscribeAuthed() {
  const { isSignedIn, isLoaded } = useAuth();
  return (
    <SubscribeBody signedIn={Boolean(isSignedIn)} loaded={isLoaded} />
  );
}

export default function SubscribePage() {
  if (!isClerkPublishableConfigured()) {
    return <SubscribeBody signedIn={false} loaded />;
  }
  return <SubscribeAuthed />;
}
