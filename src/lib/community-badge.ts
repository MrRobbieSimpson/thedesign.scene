import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles, type CommunityBadge } from "@/db/schema";

/** Soft cap — first cohort of founding writers. */
export const FOUNDING_WRITER_LIMIT = 10;

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

export async function countFoundingWriters(): Promise<number> {
  if (!db) return 0;
  const [row] = await db
    .select({ value: count() })
    .from(profiles)
    .where(eq(profiles.communityBadge, "founding_writer"));
  return Number(row?.value ?? 0);
}

/**
 * Badge to stamp on a brand-new profile.
 * Founder if Clerk id is allowlisted; else founding writer while under the cap.
 */
export async function resolveNewProfileBadge(
  clerkUserId: string
): Promise<CommunityBadge> {
  if (founderClerkIds().has(clerkUserId)) return "founder";
  const n = await countFoundingWriters();
  if (n < FOUNDING_WRITER_LIMIT) return "founding_writer";
  return "none";
}

/**
 * Grant founding writer on first publish if a slot remains.
 * No-ops if they already have founder / founding_writer / cap full.
 */
export async function maybeGrantFoundingWriterOnPublish(
  profileId: string
): Promise<CommunityBadge | null> {
  if (!db) return null;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, profileId),
    columns: { id: true, communityBadge: true, clerkUserId: true },
  });
  if (!profile) return null;
  if (profile.communityBadge === "founder") return "founder";
  if (profile.communityBadge === "founding_writer") return "founding_writer";

  if (founderClerkIds().has(profile.clerkUserId)) {
    await db
      .update(profiles)
      .set({ communityBadge: "founder" })
      .where(eq(profiles.id, profileId));
    return "founder";
  }

  const n = await countFoundingWriters();
  if (n >= FOUNDING_WRITER_LIMIT) return null;

  // Optimistic slot claim — unique enough at this scale.
  await db
    .update(profiles)
    .set({ communityBadge: "founding_writer" })
    .where(
      and(eq(profiles.id, profileId), eq(profiles.communityBadge, "none"))
    );

  const updated = await db.query.profiles.findFirst({
    where: eq(profiles.id, profileId),
    columns: { communityBadge: true },
  });
  return updated?.communityBadge === "founding_writer"
    ? "founding_writer"
    : null;
}
