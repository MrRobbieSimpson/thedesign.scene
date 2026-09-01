import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import {
  bestAvatarFromClerkUser,
  isSharpAvatarUrl,
  xHandleFromClerkUser,
} from "@/lib/avatar";
import { isClerkConfigured } from "@/lib/clerk";

function adminUserIdSet() {
  return new Set(
    (process.env.ADMIN_CLERK_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

function adminEmailSet() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminClerkUserId(userId: string | null | undefined) {
  if (!userId) return false;
  return adminUserIdSet().has(userId);
}

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
 * True when the signed-in user is on the admin allowlist
 * (ADMIN_CLERK_USER_IDS and/or ADMIN_EMAILS).
 */
export async function isAdmin() {
  const userId = await getClerkUserId();
  if (isAdminClerkUserId(userId)) return true;

  const emails = adminEmailSet();
  if (emails.size === 0) return false;

  const user = await currentUser();
  const candidates = [
    user?.primaryEmailAddress?.emailAddress,
    ...(user?.emailAddresses?.map((entry) => entry.emailAddress) ?? []),
  ]
    .filter(Boolean)
    .map((email) => email!.toLowerCase());

  return candidates.some((email) => emails.has(email));
}

export async function requireAdmin() {
  const ok = await isAdmin();
  if (!ok) {
    throw new Error("Forbidden");
  }
  return true;
}

/**
 * Ensure a local profile row exists for the signed-in Clerk user.
 * Existing profiles return immediately (no Clerk API). Clerk is only
 * contacted when creating a new row or when `syncFromClerk` is true
 * (e.g. settings / explicit refresh).
 */
export async function getOrCreateProfile(options?: {
  syncFromClerk?: boolean;
}): Promise<Profile | null> {
  if (!db) return null;

  const userId = await getClerkUserId();
  if (!userId) return null;

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.clerkUserId, userId),
  });

  const syncFromClerk = options?.syncFromClerk === true;

  // Hot path: profile already exists and caller doesn’t need a Clerk sync.
  if (existing && !syncFromClerk) {
    return existing;
  }

  // Backend user includes external-account imageUrls that unwrap to
  // pbs.twimg / Google CDNs. currentUser() alone often only has the soft thumb.
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const displayName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "Reader";
  const handle = user.username ?? null;
  const shaped = {
    imageUrl: user.imageUrl,
    username: user.username,
    externalAccounts: user.externalAccounts.map((account) => ({
      provider: account.provider,
      username: account.username,
      imageUrl: account.imageUrl,
    })),
  };
  const resolvedAvatar = bestAvatarFromClerkUser(shaped, 128);
  const xHandle = xHandleFromClerkUser(shaped);

  if (existing) {
    // Never replace a sharp CDN avatar with Clerk’s soft OAuth thumb.
    const nextAvatar =
      resolvedAvatar &&
      (!isSharpAvatarUrl(existing.avatarUrl) ||
        isSharpAvatarUrl(resolvedAvatar))
        ? resolvedAvatar
        : existing.avatarUrl;

    const needsUpdate =
      (nextAvatar && nextAvatar !== existing.avatarUrl) ||
      (xHandle && xHandle !== existing.xHandle) ||
      (!existing.xHandle && xHandle) ||
      (!existing.displayName && displayName);

    if (needsUpdate) {
      const [updated] = await db
        .update(profiles)
        .set({
          avatarUrl: nextAvatar ?? existing.avatarUrl,
          xHandle: xHandle ?? existing.xHandle,
          displayName: existing.displayName ?? displayName,
        })
        .where(eq(profiles.id, existing.id))
        .returning();
      revalidateTag("profiles");
      return updated ?? existing;
    }
    return existing;
  }

  const [created] = await db
    .insert(profiles)
    .values({
      clerkUserId: userId,
      displayName,
      handle,
      avatarUrl: resolvedAvatar ?? user.imageUrl ?? null,
      xHandle,
    })
    .returning();

  revalidateTag("profiles");
  return created;
}

export async function requireProfile() {
  const profile = await getOrCreateProfile();
  if (!profile) {
    throw new Error("Unauthorized");
  }
  return profile;
}
