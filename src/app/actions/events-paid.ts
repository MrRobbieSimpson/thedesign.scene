"use server";

import { eq } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import { db, isDatabaseConfigured } from "@/db";
import { events, type EventType } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/auth";
import {
  createEventCheckoutSession,
} from "@/lib/event-post";
import {
  isValidContactEmail,
  normalizeHttpUrl,
} from "@/lib/paid-checkout";
import {
  EVENT_POST_AMOUNT_CENTS,
  EVENT_POST_CURRENCY,
  isStripeConfigured,
} from "@/lib/stripe";

export type EventPaidActionResult = {
  ok: boolean;
  message: string;
};

export async function submitPaidEvent(
  formData: FormData
): Promise<EventPaidActionResult> {
  if (!isDatabaseConfigured() || !db) {
    return { ok: false, message: "Database not configured. Try again later." };
  }
  if (!isStripeConfigured()) {
    return { ok: false, message: "Event posting is temporarily unavailable." };
  }

  const profile = await getOrCreateProfile();
  if (!profile) {
    return { ok: false, message: "Sign in to post an event." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description =
    String(formData.get("description") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const contactEmail = String(formData.get("contactEmail") ?? "")
    .trim()
    .toLowerCase();
  const url = normalizeHttpUrl(String(formData.get("url") ?? ""));
  const typeRaw = String(formData.get("type") ?? "in-person");
  const startRaw = String(formData.get("startDate") ?? "").trim();

  if (!title) return { ok: false, message: "Event title is required." };
  if (!url) return { ok: false, message: "A valid event URL is required." };
  if (!contactEmail || !isValidContactEmail(contactEmail)) {
    return { ok: false, message: "A valid contact email is required." };
  }
  if (!startRaw) return { ok: false, message: "Start date is required." };

  const startDate = new Date(startRaw);
  if (!Number.isFinite(startDate.getTime())) {
    return { ok: false, message: "Start date is invalid." };
  }

  const type = (
    ["in-person", "hybrid", "remote"].includes(typeRaw) ? typeRaw : "in-person"
  ) as EventType;

  const clerkUser = await currentUser();
  const clerkEmail =
    clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;

  const [inserted] = await db
    .insert(events)
    .values({
      title,
      description,
      location,
      url,
      type,
      startDate,
      contactEmail,
      source: "paid",
      status: "pending_payment",
      postedByProfileId: profile.id,
      amountCents: EVENT_POST_AMOUNT_CENTS,
      currency: EVENT_POST_CURRENCY,
    })
    .returning({ id: events.id });

  if (!inserted?.id) {
    return { ok: false, message: "Could not create listing. Try again." };
  }

  try {
    const session = await createEventCheckoutSession({
      eventId: inserted.id,
      customerEmail: contactEmail || clerkEmail || contactEmail,
    });

    if (!session.url) {
      await db
        .update(events)
        .set({ status: "cancelled" })
        .where(eq(events.id, inserted.id));
      return {
        ok: false,
        message: "Could not start checkout. Try again shortly.",
      };
    }

    await db
      .update(events)
      .set({ stripeCheckoutSessionId: session.id })
      .where(eq(events.id, inserted.id));

    redirect(session.url);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[submitPaidEvent] checkout failed", error);
    await db
      .update(events)
      .set({ status: "cancelled" })
      .where(eq(events.id, inserted.id));
    return {
      ok: false,
      message: "Checkout failed. Your card was not charged — try again.",
    };
  }
}
