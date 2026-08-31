"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

import { subscribeToDigest } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isClerkPublishableConfigured } from "@/lib/clerk";
import { cn } from "@/lib/utils";

function DigestShell({
  action,
  message,
  error,
  footnote,
}: {
  action: React.ReactNode;
  message: string | null;
  error: boolean;
  footnote?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-foreground px-4 py-5 text-background sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg tracking-tight text-background sm:text-xl">
            Digest
          </h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-background/70">
            A short Thursday note — picks, writing, and a few events. No account
            required.
          </p>
        </div>
        <div className="w-full shrink-0 sm:w-auto sm:max-w-sm">{action}</div>
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
        <p className="mt-3 text-xs leading-relaxed text-background/55">
          {footnote}
        </p>
      )}
    </section>
  );
}

function DigestStripAuthed() {
  const { isSignedIn, isLoaded } = useAuth();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  function submit(formData?: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await subscribeToDigest(formData);
      setError(!result.ok);
      setMessage(result.message);
      if (result.ok) setEmail("");
    });
  }

  const btnClass =
    "h-9 shrink-0 border border-background/20 bg-background px-3.5 text-foreground hover:bg-background/90 sm:px-4";

  if (!isLoaded) {
    return (
      <DigestShell
        action={
          <div className="h-9 w-full animate-pulse rounded-lg bg-background/20 sm:w-56" />
        }
        message={null}
        error={false}
      />
    );
  }

  if (isSignedIn) {
    return (
      <DigestShell
        action={
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => submit()}
            className={cn(btnClass, "w-full sm:w-auto")}
          >
            {pending ? "…" : "Join the digest"}
          </Button>
        }
        message={message}
        error={error}
        footnote={
          <>
            Uses your profile location for nearby events.{" "}
            <Link
              href="/settings/profile"
              className="text-background underline-offset-4 hover:underline"
            >
              Set location
            </Link>
            .
          </>
        }
      />
    );
  }

  return (
    <DigestShell
      action={
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
          action={(fd) => submit(fd)}
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
            className="h-9 border-background/25 bg-background/10 text-background placeholder:text-background/45"
          />
          <Button
            type="submit"
            size="sm"
            disabled={pending || !email.trim()}
            className={btnClass}
          >
            {pending ? "…" : "Join"}
          </Button>
        </form>
      }
      message={message}
      error={error}
      footnote={
        <>
          Prefer events near you?{" "}
          <Link
            href="/sign-in"
            className="text-background underline-offset-4 hover:underline"
          >
            Sign in
          </Link>{" "}
          and add a location.
        </>
      }
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
            className="h-9 w-full border border-background/20 bg-background px-3.5 text-foreground sm:w-auto sm:px-4"
            render={<Link href="/subscribe" />}
            nativeButton={false}
          >
            Join the digest
          </Button>
        }
        message={null}
        error={false}
        footnote="A short Thursday note — no account required."
      />
    );
  }

  return <DigestStripAuthed />;
}
