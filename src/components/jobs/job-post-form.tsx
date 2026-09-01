"use client";

import { useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { submitPaidJob } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JOB_POST_AMOUNT_CENTS } from "@/lib/stripe";

const priceLabel = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(JOB_POST_AMOUNT_CENTS / 100);

export function JobPostForm({
  defaultEmail = "",
  stripeReady,
}: {
  defaultEmail?: string;
  stripeReady: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "1";
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(
    canceled ? "Checkout canceled — nothing was charged." : null
  );
  const [error, setError] = useState(canceled);

  function onSubmit(formData: FormData) {
    setMessage(null);
    setError(false);
    startTransition(async () => {
      const result = await submitPaidJob(formData);
      // redirect() succeeds without returning; only errors land here.
      if (result && !result.ok) {
        setError(true);
        setMessage(result.message);
      }
    });
  }

  if (!stripeReady) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card px-5 py-8 text-sm leading-relaxed text-muted-foreground">
        Job posting is temporarily unavailable. Email us or try again later.
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="space-y-5 rounded-2xl border border-border/70 bg-card p-5 sm:p-6"
    >
      <div className="space-y-1">
        <h2 className="font-heading text-xl tracking-tight">Role details</h2>
        <p className="text-sm text-muted-foreground">
          UI and product design openings only. After payment we review before
          it goes live — usually within a few days.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="post-title">Role title</Label>
          <Input
            id="post-title"
            name="title"
            required
            disabled={pending}
            placeholder="Senior Product Designer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="post-company">Company</Label>
          <Input
            id="post-company"
            name="company"
            required
            disabled={pending}
            placeholder="Studio name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="post-role-kind">Kind</Label>
          <Input
            id="post-role-kind"
            name="roleKind"
            disabled={pending}
            placeholder="Product Design"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="post-work-mode">Work mode</Label>
          <select
            id="post-work-mode"
            name="workMode"
            defaultValue="remote"
            disabled={pending}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On site</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="post-location">Location</Label>
          <Input
            id="post-location"
            name="location"
            disabled={pending}
            placeholder="London · Remote · etc."
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="post-url">Apply URL</Label>
          <Input
            id="post-url"
            name="url"
            type="url"
            required
            disabled={pending}
            placeholder="https://"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="post-company-url">Company URL</Label>
          <Input
            id="post-company-url"
            name="companyUrl"
            type="url"
            disabled={pending}
            placeholder="https://"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="post-description">Brief</Label>
          <Textarea
            id="post-description"
            name="description"
            rows={4}
            disabled={pending}
            placeholder="One or two calm sentences — what the role is."
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="post-contact">Contact email</Label>
          <Input
            id="post-contact"
            name="contactEmail"
            type="email"
            required
            autoComplete="email"
            defaultValue={defaultEmail}
            disabled={pending}
            placeholder="hiring@studio.com"
          />
          <p className="text-xs text-muted-foreground">
            Used for Stripe receipt and if we need to reach you about the
            listing.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {message ? (
            <span className={error ? "text-destructive" : ""}>{message}</span>
          ) : (
            <>
              <span className="font-medium text-foreground">{priceLabel}</span>
              {" · "}
              one listing · reviewed before publish
            </>
          )}
        </p>
        <Button
          type="submit"
          disabled={pending}
          className="h-9 border-0 bg-foreground px-4 text-background hover:bg-foreground/90 hover:text-background"
        >
          {pending ? "Starting checkout…" : `Pay ${priceLabel} & submit`}
        </Button>
      </div>
    </form>
  );
}
