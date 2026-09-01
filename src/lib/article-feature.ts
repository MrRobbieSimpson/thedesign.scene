import { eq } from "drizzle-orm";

import { db } from "@/db";
import { content } from "@/db/schema";
import { createPaidCheckoutSession } from "@/lib/paid-checkout";
import {
  ARTICLE_FEATURE_AMOUNT_CENTS,
} from "@/lib/stripe";

export async function markArticleFeaturePaidFromCheckout(options: {
  contentId: string;
  checkoutSessionId: string;
  paymentIntentId?: string | null;
  amountCents?: number | null;
}) {
  if (!db) return { ok: false as const, reason: "no_db" };

  const existing = await db.query.content.findFirst({
    where: eq(content.id, options.contentId),
  });

  if (!existing) return { ok: false as const, reason: "not_found" };

  if (
    existing.featured ||
    existing.featureBoostStatus === "pending_review"
  ) {
    return { ok: true as const, already: true as const };
  }

  if (existing.featureBoostStatus !== "pending_payment") {
    return { ok: false as const, reason: "bad_status" as const };
  }

  await db
    .update(content)
    .set({
      featureBoostStatus: "pending_review",
      featurePaidAt: new Date(),
      featureStripeCheckoutSessionId: options.checkoutSessionId,
      featureStripePaymentIntentId:
        options.paymentIntentId ?? existing.featureStripePaymentIntentId,
      featureAmountCents:
        options.amountCents ??
        existing.featureAmountCents ??
        ARTICLE_FEATURE_AMOUNT_CENTS,
    })
    .where(eq(content.id, options.contentId));

  return { ok: true as const, already: false as const };
}

export async function createArticleFeatureCheckoutSession(options: {
  contentId: string;
  customerEmail: string;
}) {
  return createPaidCheckoutSession({
    kind: "article_feature",
    entityId: options.contentId,
    customerEmail: options.customerEmail,
  });
}
