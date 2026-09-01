import { eq } from "drizzle-orm";

import { db } from "@/db";
import { jobs } from "@/db/schema";
import {
  JOB_POST_AMOUNT_CENTS,
  JOB_POST_CURRENCY,
  JOB_POST_LABEL,
  getStripe,
  isStripeConfigured,
} from "@/lib/stripe";
import { absoluteUrl } from "@/lib/site";

export { JOB_POST_AMOUNT_CENTS, JOB_POST_CURRENCY, JOB_POST_LABEL };

export function normalizeJobUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isValidContactEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * After Stripe Checkout succeeds — move paid listing into the review queue.
 * Idempotent for already-reviewed / published rows.
 */
export async function markJobPaidFromCheckout(options: {
  jobId: string;
  checkoutSessionId: string;
  paymentIntentId?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  customerEmail?: string | null;
}) {
  if (!db) return { ok: false as const, reason: "no_db" };

  const existing = await db.query.jobs.findFirst({
    where: eq(jobs.id, options.jobId),
  });

  if (!existing) return { ok: false as const, reason: "not_found" };

  if (
    existing.status === "pending_review" ||
    existing.status === "published" ||
    existing.status === "closed"
  ) {
    return { ok: true as const, already: true as const };
  }

  if (existing.status !== "pending_payment") {
    return { ok: false as const, reason: "bad_status" as const };
  }

  await db
    .update(jobs)
    .set({
      status: "pending_review",
      paidAt: new Date(),
      stripeCheckoutSessionId: options.checkoutSessionId,
      stripePaymentIntentId: options.paymentIntentId ?? existing.stripePaymentIntentId,
      amountCents: options.amountCents ?? existing.amountCents ?? JOB_POST_AMOUNT_CENTS,
      currency:
        options.currency?.toLowerCase() ??
        existing.currency ??
        JOB_POST_CURRENCY,
      contactEmail:
        options.customerEmail?.trim() || existing.contactEmail || null,
    })
    .where(eq(jobs.id, options.jobId));

  return { ok: true as const, already: false as const };
}

export async function createJobCheckoutSession(options: {
  jobId: string;
  customerEmail: string;
}) {
  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }

  const priceId = process.env.STRIPE_JOB_PRICE_ID?.trim();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: options.customerEmail,
    client_reference_id: options.jobId,
    metadata: {
      jobId: options.jobId,
      kind: "job_post",
    },
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: JOB_POST_CURRENCY,
              unit_amount: JOB_POST_AMOUNT_CENTS,
              product_data: {
                name: JOB_POST_LABEL,
                description:
                  "One UI / product design opening on sit with design. Reviewed before it goes live.",
              },
            },
          },
        ],
    success_url: absoluteUrl(
      `/jobs/post/success?session_id={CHECKOUT_SESSION_ID}`
    ),
    cancel_url: absoluteUrl("/jobs/post?canceled=1"),
  });

  return session;
}
