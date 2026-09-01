import { eq } from "drizzle-orm";

import { db } from "@/db";
import { events } from "@/db/schema";
import { createPaidCheckoutSession } from "@/lib/paid-checkout";
import {
  EVENT_POST_AMOUNT_CENTS,
  EVENT_POST_CURRENCY,
} from "@/lib/stripe";

export async function markEventPaidFromCheckout(options: {
  eventId: string;
  checkoutSessionId: string;
  paymentIntentId?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  customerEmail?: string | null;
}) {
  if (!db) return { ok: false as const, reason: "no_db" };

  const existing = await db.query.events.findFirst({
    where: eq(events.id, options.eventId),
  });

  if (!existing) return { ok: false as const, reason: "not_found" };

  if (
    existing.status === "pending_review" ||
    existing.status === "published" ||
    existing.status === "cancelled"
  ) {
    return { ok: true as const, already: true as const };
  }

  if (existing.status !== "pending_payment") {
    return { ok: false as const, reason: "bad_status" as const };
  }

  await db
    .update(events)
    .set({
      status: "pending_review",
      paidAt: new Date(),
      stripeCheckoutSessionId: options.checkoutSessionId,
      stripePaymentIntentId:
        options.paymentIntentId ?? existing.stripePaymentIntentId,
      amountCents:
        options.amountCents ?? existing.amountCents ?? EVENT_POST_AMOUNT_CENTS,
      currency:
        options.currency?.toLowerCase() ??
        existing.currency ??
        EVENT_POST_CURRENCY,
      contactEmail:
        options.customerEmail?.trim() || existing.contactEmail || null,
    })
    .where(eq(events.id, options.eventId));

  return { ok: true as const, already: false as const };
}

export async function createEventCheckoutSession(options: {
  eventId: string;
  customerEmail: string;
}) {
  return createPaidCheckoutSession({
    kind: "event_post",
    entityId: options.eventId,
    customerEmail: options.customerEmail,
  });
}
