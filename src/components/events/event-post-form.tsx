"use client";

import { useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { submitPaidEvent } from "@/app/actions/events-paid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_POST_AMOUNT_CENTS } from "@/lib/stripe";

const priceLabel = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(EVENT_POST_AMOUNT_CENTS / 100);

export function EventPostForm({
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
      const result = await submitPaidEvent(formData);
      if (result && !result.ok) {
        setError(true);
        setMessage(result.message);
      }
    });
  }

  if (!stripeReady) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card px-5 py-8 text-sm leading-relaxed text-muted-foreground">
        Event posting is temporarily unavailable. Try again later.
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
        <h2 className="font-heading text-xl tracking-tight">Event details</h2>
        <p className="text-sm text-muted-foreground">
          Design talks, meetups, and conferences. After payment we review before
          it goes live.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="event-title">Title</Label>
          <Input
            id="event-title"
            name="title"
            required
            disabled={pending}
            placeholder="Design Systems Meetup"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-type">Type</Label>
          <select
            id="event-type"
            name="type"
            defaultValue="in-person"
            disabled={pending}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="in-person">In person</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-start">Starts</Label>
          <Input
            id="event-start"
            name="startDate"
            type="datetime-local"
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="event-location">Location</Label>
          <Input
            id="event-location"
            name="location"
            disabled={pending}
            placeholder="London · Online · etc."
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="event-url">Event URL</Label>
          <Input
            id="event-url"
            name="url"
            type="url"
            required
            disabled={pending}
            placeholder="https://"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="event-description">Brief</Label>
          <Textarea
            id="event-description"
            name="description"
            rows={3}
            disabled={pending}
            placeholder="One or two calm sentences."
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="event-contact">Contact email</Label>
          <Input
            id="event-contact"
            name="contactEmail"
            type="email"
            required
            autoComplete="email"
            defaultValue={defaultEmail}
            disabled={pending}
            placeholder="hello@studio.com"
          />
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
              reviewed before publish
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
