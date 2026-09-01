import Stripe from "stripe";

export const PAID_CURRENCY = "usd";

/** Company job listing. */
export const JOB_POST_AMOUNT_CENTS = 7000;
export const JOB_POST_CURRENCY = PAID_CURRENCY;
export const JOB_POST_LABEL = "Job listing — sit with design";

/** Company / organiser event listing (same fee as jobs). */
export const EVENT_POST_AMOUNT_CENTS = 7000;
export const EVENT_POST_CURRENCY = PAID_CURRENCY;
export const EVENT_POST_LABEL = "Event listing — sit with design";

/** Author boost — feature a published article as an editor’s pick. */
export const ARTICLE_FEATURE_AMOUNT_CENTS = 1000;
export const ARTICLE_FEATURE_CURRENCY = PAID_CURRENCY;
export const ARTICLE_FEATURE_LABEL = "Feature writing — sit with design";

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
    });
  }
  return stripeClient;
}
