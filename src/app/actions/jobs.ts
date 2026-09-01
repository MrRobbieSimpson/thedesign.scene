"use server";

import { eq } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import { db, isDatabaseConfigured } from "@/db";
import { jobs, type JobWorkMode } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/auth";
import {
  JOB_POST_AMOUNT_CENTS,
  JOB_POST_CURRENCY,
  createJobCheckoutSession,
  isValidContactEmail,
  normalizeJobUrl,
} from "@/lib/job-post";
import { isStripeConfigured } from "@/lib/stripe";

export type JobActionResult = {
  ok: boolean;
  message: string;
};

const DESC_MAX = 4000;

/**
 * Signed-in company post → draft pending_payment → Stripe Checkout ($70).
 * On success, webhook promotes to pending_review.
 */
export async function submitPaidJob(
  formData: FormData
): Promise<JobActionResult> {
  if (!isDatabaseConfigured() || !db) {
    return {
      ok: false,
      message: "Database not configured. Try again later.",
    };
  }

  if (!isStripeConfigured()) {
    return {
      ok: false,
      message: "Job posting is temporarily unavailable.",
    };
  }

  const profile = await getOrCreateProfile();
  if (!profile) {
    return { ok: false, message: "Sign in to post a role." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const roleKind = String(formData.get("roleKind") ?? "").trim() || null;
  const workModeRaw = String(formData.get("workMode") ?? "remote");
  const contactEmail = String(formData.get("contactEmail") ?? "")
    .trim()
    .toLowerCase();
  const url = normalizeJobUrl(String(formData.get("url") ?? ""));
  const companyUrl = normalizeJobUrl(String(formData.get("companyUrl") ?? ""));

  if (!title) return { ok: false, message: "Role title is required." };
  if (!company) return { ok: false, message: "Company is required." };
  if (!url) return { ok: false, message: "A valid apply URL is required." };
  if (!contactEmail || !isValidContactEmail(contactEmail)) {
    return { ok: false, message: "A valid contact email is required." };
  }
  if (description && description.length > DESC_MAX) {
    return {
      ok: false,
      message: `Brief is too long (max ${DESC_MAX} characters).`,
    };
  }

  const workMode = (
    ["remote", "hybrid", "onsite"].includes(workModeRaw)
      ? workModeRaw
      : "remote"
  ) as JobWorkMode;

  const clerkUser = await currentUser();
  const clerkEmail =
    clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;

  const [inserted] = await db
    .insert(jobs)
    .values({
      title,
      company,
      description,
      location,
      roleKind,
      workMode,
      url,
      companyUrl,
      contactEmail,
      source: "paid",
      status: "pending_payment",
      postedByProfileId: profile.id,
      amountCents: JOB_POST_AMOUNT_CENTS,
      currency: JOB_POST_CURRENCY,
    })
    .returning({ id: jobs.id });

  if (!inserted?.id) {
    return { ok: false, message: "Could not create listing. Try again." };
  }

  try {
    const session = await createJobCheckoutSession({
      jobId: inserted.id,
      customerEmail: contactEmail || clerkEmail || contactEmail,
    });

    if (!session.url) {
      await db
        .update(jobs)
        .set({ status: "closed" })
        .where(eq(jobs.id, inserted.id));
      return {
        ok: false,
        message: "Could not start checkout. Try again shortly.",
      };
    }

    await db
      .update(jobs)
      .set({ stripeCheckoutSessionId: session.id })
      .where(eq(jobs.id, inserted.id));

    redirect(session.url);
  } catch (error) {
    if (isRedirectError(error)) throw error;

    console.error("[submitPaidJob] checkout failed", error);
    await db
      .update(jobs)
      .set({ status: "closed" })
      .where(eq(jobs.id, inserted.id));
    return {
      ok: false,
      message: "Checkout failed. Your card was not charged — try again.",
    };
  }
}
