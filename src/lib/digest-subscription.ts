import { and, eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

import { db, isDatabaseConfigured } from "@/db";
import { newsletterSubscribers, profiles } from "@/db/schema";
import { getClerkUserId } from "@/lib/auth";

/** Client hint after a successful guest/signed-in subscribe. */
export const DIGEST_SUBSCRIBED_STORAGE_KEY = "tds-digest-subscribed";

/**
 * True when the current visitor is an active digest subscriber
 * (matched by Clerk email and/or local profile id).
 */
export async function isCurrentUserOnDigest(): Promise<boolean> {
  if (!isDatabaseConfigured() || !db) return false;

  const userId = await getClerkUserId();
  if (!userId) return false;

  const [user, profile] = await Promise.all([
    currentUser(),
    db.query.profiles.findFirst({
      where: eq(profiles.clerkUserId, userId),
      columns: { id: true },
    }),
  ]);

  const email =
    user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null;

  if (email) {
    const byEmail = await db.query.newsletterSubscribers.findFirst({
      where: and(
        eq(newsletterSubscribers.email, email),
        eq(newsletterSubscribers.status, "active")
      ),
      columns: { id: true },
    });
    if (byEmail) return true;
  }

  if (profile?.id) {
    const byProfile = await db.query.newsletterSubscribers.findFirst({
      where: and(
        eq(newsletterSubscribers.profileId, profile.id),
        eq(newsletterSubscribers.status, "active")
      ),
      columns: { id: true },
    });
    if (byProfile) return true;
  }

  return false;
}
