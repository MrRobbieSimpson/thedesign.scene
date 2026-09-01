import { eq } from "drizzle-orm";

import { db, isDatabaseConfigured } from "@/db";
import { profiles } from "@/db/schema";
import { getClerkUserId, getOrCreateProfile } from "@/lib/auth";
import { isClerkConfigured } from "@/lib/clerk";

/**
 * Ensures a local profile row exists for the signed-in Clerk user.
 * Fast path: one indexed DB lookup. Only calls Clerk when creating a new row —
 * never on every navigation (that was tanking page transitions).
 */
export async function EnsureProfile() {
  if (!isClerkConfigured() || !isDatabaseConfigured() || !db) return null;

  const userId = await getClerkUserId();
  if (!userId) return null;

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.clerkUserId, userId),
    columns: { id: true },
  });

  if (existing) return null;

  // First visit after sign-up — create the local profile once.
  await getOrCreateProfile();
  return null;
}
