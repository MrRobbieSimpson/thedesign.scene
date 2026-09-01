import Link from "next/link";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

import { Button } from "@/components/ui/button";
import { db, isDatabaseConfigured } from "@/db";
import { events } from "@/db/schema";
import { markEventPaidFromCheckout } from "@/lib/event-post";
import { buildPageMetadata } from "@/lib/seo";
import { getStripe } from "@/lib/stripe";

export const metadata = buildPageMetadata({
  title: "Event submitted",
  path: "/events/post/success",
  description: "Your event payment was received and is awaiting review.",
});

export default async function EventPostSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  let confirmed = false;
  let title: string | null = null;

  if (sessionId && isDatabaseConfigured() && db) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const eventId =
          session.metadata?.eventId || session.client_reference_id || null;

        if (
          eventId &&
          session.payment_status === "paid" &&
          session.metadata?.kind === "event_post"
        ) {
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null;

          const marked = await markEventPaidFromCheckout({
            eventId,
            checkoutSessionId: session.id,
            paymentIntentId,
            amountCents: session.amount_total,
            currency: session.currency,
            customerEmail:
              session.customer_details?.email ?? session.customer_email,
          });

          if (marked.ok && !marked.already) {
            revalidatePath("/admin");
            revalidatePath("/events");
            revalidateTag("events");
          }

          const row = await db.query.events.findFirst({
            where: eq(events.id, eventId),
            columns: { title: true, status: true, paidAt: true },
          });
          if (row && (row.paidAt || row.status === "pending_review")) {
            confirmed = true;
            title = row.title;
          }
        }
      } catch (error) {
        console.error("[event post success]", error);
      }
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[45rem] px-5 py-10 sm:px-6 sm:py-20">
      <section className="space-y-4">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Submitted
        </p>
        <h1 className="font-heading text-[1.85rem] tracking-tight text-balance sm:text-4xl">
          {confirmed
            ? "Thanks — we’ll review your event."
            : "Payment received."}
        </h1>
        <p className="max-w-prose text-base leading-relaxed text-muted-foreground sm:text-lg">
          {confirmed && title ? (
            <>
              <span className="text-foreground">{title}</span> is in the review
              queue. We’ll publish it when it meets the bar.
            </>
          ) : (
            <>
              If you just completed checkout, your event is in the queue.
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-3 pt-4">
          <Button
            className="h-9 border-0 bg-foreground px-4 text-background hover:bg-foreground/90 hover:text-background"
            render={<Link href="/events" />}
            nativeButton={false}
          >
            View events
          </Button>
        </div>
      </section>
    </div>
  );
}
