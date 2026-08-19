"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export type UpdateProfileResult =
  | { ok: true; handle: string | null }
  | { ok: false; message: string };

export async function updateMyProfile(
  formData: FormData
): Promise<UpdateProfileResult> {
  if (!db) return { ok: false, message: "Database not configured." };

  const profile = await requireProfile();

  const displayName =
    String(formData.get("displayName") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const websiteRaw = String(formData.get("website") ?? "").trim();
  const website = websiteRaw
    ? /^https?:\/\//i.test(websiteRaw)
      ? websiteRaw
      : `https://${websiteRaw}`
    : null;
  const xHandle =
    String(formData.get("xHandle") ?? "")
      .trim()
      .replace(/^@/, "") || null;
  const location = String(formData.get("location") ?? "").trim() || null;

  const handleRaw = String(formData.get("handle") ?? "").trim();
  const handle = handleRaw ? slugify(handleRaw) : null;

  if (handleRaw && !handle) {
    return {
      ok: false,
      message: "Handle must use letters, numbers, or hyphens.",
    };
  }

  if (handle) {
    const taken = await db.query.profiles.findFirst({
      where: and(eq(profiles.handle, handle), ne(profiles.id, profile.id)),
      columns: { id: true },
    });
    if (taken) {
      return { ok: false, message: "That handle is already taken." };
    }
  }

  const previousHandle = profile.handle;

  const [updated] = await db
    .update(profiles)
    .set({
      displayName,
      handle,
      bio,
      website,
      xHandle,
      location,
    })
    .where(eq(profiles.id, profile.id))
    .returning();

  revalidateTag("profiles");
  revalidatePath("/settings/profile");
  if (previousHandle) revalidatePath(`/u/${previousHandle}`);
  if (updated.handle) revalidatePath(`/u/${updated.handle}`);

  return { ok: true, handle: updated.handle };
}
