"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function upsertSubscriber(email: string, profileId: string | null) {
  const existing = await db!.query.newsletterSubscribers.findFirst({
    where: eq(newsletterSubscribers.email, email),
  });

  if (existing) {
    await db!
      .update(newsletterSubscribers)
      .set({
        status: "active",
        profileId: profileId ?? existing.profileId,
        confirmedAt: new Date(),
        unsubscribedAt: null,
      })
      .where(eq(newsletterSubscribers.id, existing.id));
    return { created: false as const, existing };
  }

  await db!.insert(newsletterSubscribers).values({
    email,
    profileId,
    status: "active",
    confirmedAt: new Date(),
  });
  return { created: true as const, existing: null };
}

/**
 * Digest subscribe — email-only for guests; signed-in users link their profile
 * so we can favour nearby events.
 */
export async function subscribeToDigest(formData?: FormData) {
  if (!db) {
    return { ok: false as const, message: "Database not configured." };
  }

  const profile = await getOrCreateProfile().catch(() => null);
  const user = profile ? await currentUser() : null;

  const clerkEmail =
    user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null;
  const formEmail =
    String(formData?.get("email") ?? "")
      .trim()
      .toLowerCase() || null;

  const email = clerkEmail || formEmail;

  if (!email || !EMAIL_RE.test(email)) {
    return {
      ok: false as const,
      message: "Enter a valid email address.",
    };
  }

  const { created, existing } = await upsertSubscriber(
    email,
    profile?.id ?? null
  );

  revalidatePath("/");
  revalidatePath("/subscribe");
  revalidatePath("/", "layout");

  if (profile?.location) {
    return {
      ok: true as const,
      message: `You’re on the list — we’ll favour events near ${profile.location}.`,
    };
  }

  if (profile) {
    return {
      ok: true as const,
      message:
        "You’re on the list. Add a location on your profile for local events.",
    };
  }

  if (!created && existing?.status === "active") {
    return { ok: true as const, message: "You’re already on the list." };
  }

  return {
    ok: true as const,
    message:
      "You’re on the list. Sign in anytime if you’d like events near you.",
  };
}
