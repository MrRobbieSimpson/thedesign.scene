"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { db } from "@/db";
import { guestTerms } from "@/db/schema";
import { requireProfile } from "@/lib/auth";

/**
 * Create a guest editor term. v1: any signed-in user can call this from admin
 * (admin route is already Clerk-protected). Tighten to allowlist later.
 */
export async function createGuestTerm(formData: FormData) {
  if (!db) return { ok: false as const, message: "Database not configured." };
  await requireProfile();

  const profileId = String(formData.get("profileId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const intro = String(formData.get("intro") ?? "").trim() || null;
  const startsAtRaw = String(formData.get("startsAt") ?? "").trim();
  const endsAtRaw = String(formData.get("endsAt") ?? "").trim();

  if (!profileId || !label || !startsAtRaw || !endsAtRaw) {
    return { ok: false as const, message: "All fields except intro are required." };
  }

  const startsAt = new Date(startsAtRaw);
  const endsAt = new Date(endsAtRaw);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime())) {
    return { ok: false as const, message: "Invalid dates." };
  }
  if (endsAt <= startsAt) {
    return { ok: false as const, message: "End must be after start." };
  }

  await db.insert(guestTerms).values({
    profileId,
    label,
    intro,
    startsAt,
    endsAt,
  });

  revalidatePath("/");
  revalidateTag("profiles");
  return { ok: true as const, message: "Guest editor term created." };
}
