"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { subscribeToDigest } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Quiet homepage callout for the weekly digest — column-width, not full-bleed.
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
    <section className="mb-12 rounded-2xl border border-border/60 bg-muted/20 px-5 py-5 sm:mb-14 sm:px-6 sm:py-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="min-w-0 space-y-1.5 sm:max-w-[16rem]">
          <h2 className="font-heading text-xl tracking-tight">Digest</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A short Thursday note — editor’s picks, new writing, and events. No
            firehose.
          </p>
        </div>

        <form
          action={onSubmit}
          className="flex w-full min-w-0 flex-col gap-2 sm:max-w-sm sm:flex-row sm:items-center"
        >
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@studio.com"
            disabled={pending}
            aria-label="Email"
            className="h-9 flex-1 bg-background/60"
          />
          <Button
            type="submit"
            size="sm"
            disabled={pending}
            className="h-9 shrink-0 px-4"
          >
            {pending ? "…" : "Subscribe"}
          </Button>
        </form>
      </div>

      {message ? (
        <p
          className={
            error
              ? "mt-3 text-sm text-destructive"
              : "mt-3 text-sm text-muted-foreground"
          }
        >
          {message}
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground/70">
          Or read more on the{" "}
          <Link
            href="/subscribe"
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            digest page
          </Link>
          .
        </p>
      )}
    </section>
  );
}
