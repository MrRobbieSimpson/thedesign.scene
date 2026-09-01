"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

import { subscribeToDigest } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DIGEST_SUBSCRIBED_STORAGE_KEY } from "@/lib/digest-subscription";

export default function SubscribePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  function onSubscribe(formData?: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await subscribeToDigest(formData);
      setError(!result.ok);
      setMessage(result.message);
      if (result.ok) {
        setEmail("");
        try {
          window.localStorage.setItem(DIGEST_SUBSCRIBED_STORAGE_KEY, "1");
          window.dispatchEvent(new Event("tds:digest-subscribed"));
        } catch {
          /* ignore */
        }
      }
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
        A short Thursday note: editor’s picks, new writing, and a few events.
        No account required.
      </p>

      <div className="mt-10 space-y-4">
        {!isLoaded ? (
          <div className="h-9 w-full max-w-sm animate-pulse rounded-lg bg-muted" />
        ) : isSignedIn ? (
          <Button
            type="button"
            disabled={pending}
            onClick={() => onSubscribe()}
          >
            {pending ? "Subscribing…" : "Join the digest"}
          </Button>
        ) : (
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
            action={(fd) => onSubscribe(fd)}
          >
            <Input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@studio.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={pending}
              className="h-9 sm:max-w-xs"
            />
            <Button type="submit" disabled={pending || !email.trim()}>
              {pending ? "Subscribing…" : "Join the digest"}
            </Button>
          </form>
        )}

        {message ? (
          <p
            className={
              error ? "text-sm text-destructive" : "text-sm text-muted-foreground"
            }
          >
            {message}{" "}
            {!error && isSignedIn ? (
              <Link
                href="/settings/profile"
                className="underline underline-offset-4 hover:underline"
              >
                Profile settings
              </Link>
            ) : null}
          </p>
        ) : !isSignedIn ? (
          <p className="text-xs leading-relaxed text-muted-foreground/80">
            Want events near you?{" "}
            <Link
              href="/sign-in"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Sign in
            </Link>{" "}
            and add a location on your profile.
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground/80">
            We’ll use your profile location for nearby events when set.
          </p>
        )}
      </div>
    </div>
  );
}
