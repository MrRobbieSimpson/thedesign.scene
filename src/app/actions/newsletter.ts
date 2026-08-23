"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { requireProfile } from "@/lib/auth";

/**
 * Digest subscribe — requires a signed-in profile so we can
 * personalise events from profile.location.
 */
export async function subscribeToDigest(_formData?: FormData) {
  if (!db) {
    return { ok: false as const, message: "Database not configured." };
  }

  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return {
      ok: false as const,
      message: "Sign in to join the digest.",
      needsAuth: true as const,
    };
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false as const,
      message: "Add an email to your account to join the digest.",
    };
  }

  const existing = await db.query.newsletterSubscribers.findFirst({
    where: eq(newsletterSubscribers.email, email),
  });

  if (existing) {
    await db
      .update(newsletterSubscribers)
      .set({
        status: "active",
        profileId: profile.id,
        confirmedAt: new Date(),
        unsubscribedAt: null,
      })
      .where(eq(newsletterSubscribers.id, existing.id));
    revalidatePath("/");
    revalidatePath("/subscribe");
    if (existing.status === "active" && existing.profileId === profile.id) {
      return {
        ok: true as const,
        message: profile.location
          ? `You’re on the list — we’ll favour events near ${profile.location}.`
          : "You’re on the list. Add a location on your profile for local events.",
      };
    }
    return { ok: true as const, message: "Welcome back — subscribed." };
  }

  await db.insert(newsletterSubscribers).values({
    email,
    profileId: profile.id,
    status: "active",
    confirmedAt: new Date(),
  });

  revalidatePath("/");
  revalidatePath("/subscribe");
  return {
    ok: true as const,
    message: profile.location
      ? `You’re on the list — we’ll favour events near ${profile.location}.`
      : "You’re on the list. Add a location on your profile for local events.",
  };
}
