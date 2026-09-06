import "server-only";

import { and, eq } from "drizzle-orm";
import { cache } from "react";

import { db, isDatabaseConfigured } from "@/db";
import { newsletterSubscribers, profiles } from "@/db/schema";
import { getClerkUserId } from "@/lib/auth";

export { DIGEST_SUBSCRIBED_STORAGE_KEY } from "@/lib/digest-subscription-client";

/**
 * Fast digest check for layout — one profile lookup + one subscriber lookup.
 * Skips Clerk `currentUser()` (slow) — signed-in subscribe always links profileId.
 * Guests rely on localStorage in the footer client component.
 */
export const isCurrentUserOnDigest = cache(async (): Promise<boolean> => {
  if (!isDatabaseConfigured() || !db) return false;

  const userId = await getClerkUserId();
  if (!userId) return false;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.clerkUserId, userId),
    columns: { id: true },
  });
  if (!profile?.id) return false;

  const row = await db.query.newsletterSubscribers.findFirst({
    where: and(
      eq(newsletterSubscribers.profileId, profile.id),
      eq(newsletterSubscribers.status, "active")
    ),
    columns: { id: true },
  });

  return Boolean(row);
});
