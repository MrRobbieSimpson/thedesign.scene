import { Suspense } from "react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

import { EventPostForm } from "@/components/events/event-post-form";
import { isStripeConfigured, EVENT_POST_AMOUNT_CENTS } from "@/lib/stripe";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Post an event",
  path: "/events/post",
  description:
    "Post a design event on sit with design — $70, reviewed before it goes live.",
});

const priceLabel = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(EVENT_POST_AMOUNT_CENTS / 100);

export default async function EventPostPage() {
  const user = await currentUser();
  const defaultEmail =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";

  return (
    <div className="mx-auto w-full min-w-0 max-w-[45rem] px-5 py-10 sm:px-6 sm:py-20">
      <section className="mb-8 space-y-4 sm:mb-10">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Post an event
        </p>
        <h1 className="font-heading text-[1.85rem] tracking-tight text-balance sm:text-5xl">
          Event coming up?
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          {priceLabel} for one listing. Payment holds your spot in the review
          queue — we publish when it meets the bar.
        </p>
        <p className="text-sm text-muted-foreground/80">
          <Link href="/events" className="underline underline-offset-4">
            Back to events
          </Link>
        </p>
      </section>

      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />
        }
      >
        <EventPostForm
          defaultEmail={defaultEmail}
          stripeReady={isStripeConfigured()}
        />
      </Suspense>
    </div>
  );
}
