"use server";

import { and, eq } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import { db, isDatabaseConfigured } from "@/db";
import { content } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/auth";
import { createArticleFeatureCheckoutSession } from "@/lib/article-feature";
import {
  ARTICLE_FEATURE_AMOUNT_CENTS,
  isStripeConfigured,
} from "@/lib/stripe";

export type FeatureActionResult = {
  ok: boolean;
  message: string;
};

/**
 * Signed-in author boosts their own published writing — $10 → pending review.
 */
export async function submitArticleFeature(
  contentId: string
): Promise<FeatureActionResult> {
  if (!isDatabaseConfigured() || !db) {
    return { ok: false, message: "Database not configured. Try again later." };
  }
  if (!isStripeConfigured()) {
    return {
      ok: false,
      message: "Featuring is temporarily unavailable.",
    };
  }

  const profile = await getOrCreateProfile();
  if (!profile) {
    return { ok: false, message: "Sign in to feature your writing." };
  }

  const item = await db.query.content.findFirst({
    where: and(eq(content.id, contentId), eq(content.status, "published")),
  });

  if (!item) {
    return { ok: false, message: "Published piece not found." };
  }
  if (item.authorProfileId !== profile.id) {
    return { ok: false, message: "You can only feature your own writing." };
  }
  if (item.featured) {
    return { ok: false, message: "This piece is already featured." };
  }
  if (
    item.featureBoostStatus === "pending_payment" ||
    item.featureBoostStatus === "pending_review"
  ) {
    return {
      ok: false,
      message: "A feature request is already in progress for this piece.",
    };
  }

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;
  if (!email) {
    return {
      ok: false,
      message: "Add an email to your account to continue checkout.",
    };
  }

  await db
    .update(content)
    .set({
      featureBoostStatus: "pending_payment",
      featureAmountCents: ARTICLE_FEATURE_AMOUNT_CENTS,
    })
    .where(eq(content.id, contentId));

  try {
    const session = await createArticleFeatureCheckoutSession({
      contentId,
      customerEmail: email,
    });

    if (!session.url) {
      await db
        .update(content)
        .set({ featureBoostStatus: "none" })
        .where(eq(content.id, contentId));
      return {
        ok: false,
        message: "Could not start checkout. Try again shortly.",
      };
    }

    await db
      .update(content)
      .set({ featureStripeCheckoutSessionId: session.id })
      .where(eq(content.id, contentId));

    redirect(session.url);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[submitArticleFeature] checkout failed", error);
    await db
      .update(content)
      .set({ featureBoostStatus: "none" })
      .where(eq(content.id, contentId));
    return {
      ok: false,
      message: "Checkout failed. Your card was not charged — try again.",
    };
  }
}
