import Stripe from "stripe";

/** One-time fee for a company job listing (USD cents). */
export const JOB_POST_AMOUNT_CENTS = 7000;
export const JOB_POST_CURRENCY = "usd";
export const JOB_POST_LABEL = "Job listing — sit with design";

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
