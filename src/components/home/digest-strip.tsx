"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { subscribeToDigest } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * High-visibility digest callout — inverted against the page
 * (dark on light mode, light on dark mode).
 */
export function DigestStrip() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await subscribeToDigest(formData);
      setError(!result.ok);
      setMessage(result.message);
    });
  }

  return (
    <section className="rounded-2xl bg-foreground px-4 py-5 text-background sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1 sm:max-w-[15rem]">
          <h2 className="font-heading text-lg tracking-tight text-background sm:text-xl">
            Digest
          </h2>
          <p className="text-sm leading-relaxed text-background/70">
            A short Thursday note — editor’s picks, writing, and events.
          </p>
        </div>

        <form
          action={onSubmit}
          className="flex w-full min-w-0 items-center gap-2 sm:max-w-sm"
        >
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@studio.com"
            disabled={pending}
            aria-label="Email"
            className="h-9 min-w-0 flex-1 border-background/15 bg-background text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="sm"
            disabled={pending}
            className="h-9 shrink-0 border border-background/20 bg-background px-3.5 text-foreground hover:bg-background/90"
          >
            {pending ? "…" : "Subscribe"}
          </Button>
        </form>
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
        </p>
      ) : (
        <p className="mt-3 text-xs text-background/55">
          Or see the{" "}
          <Link
            href="/subscribe"
            className="text-background underline-offset-4 transition-opacity hover:underline"
          >
            digest page
          </Link>
          .
        </p>
      )}
    </section>
  );
}
