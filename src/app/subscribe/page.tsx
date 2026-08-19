"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { subscribeToDigest } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SubscribePage() {
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
    <div className="mx-auto max-w-lg px-6 py-16 sm:py-24">
      <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Weekly digest
      </p>
      <h1 className="mt-3 font-heading text-4xl tracking-tight">
        Design worth sitting with — in your inbox.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        A short Thursday note: editor’s picks, new writing, and upcoming events.
        No firehose. Unsubscribe anytime.
      </p>

      <form action={onSubmit} className="mt-10 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@studio.com"
            disabled={pending}
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Subscribing…" : "Subscribe"}
        </Button>
        {message ? (
          <p
            className={
              error ? "text-sm text-destructive" : "text-sm text-muted-foreground"
            }
          >
            {message}
          </p>
        ) : null}
      </form>

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
