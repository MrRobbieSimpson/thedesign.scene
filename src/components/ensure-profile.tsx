import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { db, isDatabaseConfigured } from "@/db";
import { profiles } from "@/db/schema";
import { getClerkUserId, getOrCreateProfile } from "@/lib/auth";
import { isClerkConfigured } from "@/lib/clerk";

function founderClerkIds() {
  const raw =
    process.env.FOUNDER_CLERK_USER_IDS?.trim() ||
    process.env.ADMIN_CLERK_USER_IDS?.trim() ||
    "";
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

/**
 * Ensures a local profile row exists for the signed-in Clerk user.
 * Fast path: one indexed DB lookup. Only calls Clerk when creating a new row.
 * Also late-binds Founder badge once (cheap allowlist check — no COUNT).
 */
export async function EnsureProfile() {
  if (!isClerkConfigured() || !isDatabaseConfigured() || !db) return null;

  const userId = await getClerkUserId();
  if (!userId) return null;

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.clerkUserId, userId),
    columns: { id: true, communityBadge: true },
  });

  if (!existing) {
    await getOrCreateProfile();
    return null;
  }

  if (
    existing.communityBadge === "none" &&
    founderClerkIds().has(userId)
  ) {
    await db
      .update(profiles)
      .set({ communityBadge: "founder" })
      .where(eq(profiles.id, existing.id));
    revalidateTag("profiles");
  }

  return null;
}
