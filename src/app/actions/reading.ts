"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { sitsWith } from "@/db/schema";
import { requireProfile } from "@/lib/auth";

export async function toggleSitWith(contentId: string) {
  if (!db) return { ok: false as const, message: "Database not configured." };

  const profile = await requireProfile();

  const existing = await db.query.sitsWith.findFirst({
    where: and(
      eq(sitsWith.profileId, profile.id),
      eq(sitsWith.contentId, contentId)
    ),
  });

  if (existing) {
    await db.delete(sitsWith).where(eq(sitsWith.id, existing.id));
    return { ok: true as const, satWith: false };
  }

  await db.insert(sitsWith).values({
    profileId: profile.id,
    contentId,
  });
  return { ok: true as const, satWith: true };
}

export async function hasSatWith(contentId: string) {
  if (!db) return false;
  try {
    const profile = await requireProfile();
    const existing = await db.query.sitsWith.findFirst({
      where: and(
        eq(sitsWith.profileId, profile.id),
        eq(sitsWith.contentId, contentId)
      ),
    });
    return Boolean(existing);
  } catch {
    return false;
  }
}
