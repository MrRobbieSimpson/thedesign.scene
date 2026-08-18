import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { isClerkConfigured } from "@/lib/clerk";

export async function getClerkUserId() {
  if (!isClerkConfigured()) return null;
  const { userId } = await auth();
  return userId;
}

export async function requireClerkUserId() {
  const userId = await getClerkUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

/**
 * Ensure a local profile row exists for the signed-in Clerk user.
 */
export async function getOrCreateProfile(): Promise<Profile | null> {
  if (!db) return null;

  const userId = await getClerkUserId();
  if (!userId) return null;

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.clerkUserId, userId),
  });
  if (existing) return existing;

  const user = await currentUser();
  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Reader";
  const handle = user?.username ?? null;
  const avatarUrl = user?.imageUrl ?? null;

  const [created] = await db
    .insert(profiles)
    .values({
      clerkUserId: userId,
      displayName,
      handle,
      avatarUrl,
    })
    .returning();

  return created;
}

export async function requireProfile() {
  const profile = await getOrCreateProfile();
  if (!profile) {
    throw new Error("Unauthorized");
  }
  return profile;
}
