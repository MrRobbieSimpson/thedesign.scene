"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

import { db } from "@/db";
import { profiles, type ProfileLink } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { timezoneFromLocation } from "@/lib/geo";
import { slugify } from "@/lib/slug";

export type UpdateProfileResult =
  | { ok: true; handle: string | null }
  | { ok: false; message: string };

const MAX_LINKS = 8;

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function parseLinks(formData: FormData): ProfileLink[] | { error: string } {
  const labels = formData
    .getAll("linkLabel")
    .map((value) => String(value).trim());
  const urls = formData.getAll("linkUrl").map((value) => String(value).trim());
  const count = Math.max(labels.length, urls.length);
  const links: ProfileLink[] = [];

  for (let i = 0; i < count; i++) {
    const label = labels[i] ?? "";
    const urlRaw = urls[i] ?? "";
    if (!label && !urlRaw) continue;
    if (!label || !urlRaw) {
      return {
        error: "Each link needs both a label and a URL.",
      };
    }
    const url = normalizeUrl(urlRaw);
    if (!url) {
      return { error: `“${label}” needs a valid http(s) URL.` };
    }
    links.push({ label: label.slice(0, 40), url });
    if (links.length >= MAX_LINKS) break;
  }

  return links;
}

export async function updateMyProfile(
  formData: FormData
): Promise<UpdateProfileResult> {
  if (!db) return { ok: false, message: "Database not configured." };

  const profile = await requireProfile();

  const displayName =
    String(formData.get("displayName") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const website = normalizeUrl(String(formData.get("website") ?? ""));
  const xHandle =
    String(formData.get("xHandle") ?? "")
      .trim()
      .replace(/^@/, "") || null;
  const location = String(formData.get("location") ?? "").trim() || null;

  const linksResult = parseLinks(formData);
  if ("error" in linksResult) {
    return { ok: false, message: linksResult.error };
  }
  const links = linksResult;

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

  // Resolve IANA timezone from location when it changes (drives header clock).
  let timezone = profile.timezone ?? null;
  if (!location) {
    timezone = null;
  } else if (
    location !== profile.location ||
    !profile.timezone
  ) {
    timezone = (await timezoneFromLocation(location)) ?? profile.timezone ?? null;
  }

  const [updated] = await db
    .update(profiles)
    .set({
      displayName,
      handle,
      bio,
      website,
      xHandle,
      location,
      timezone,
      links,
    })
    .where(eq(profiles.id, profile.id))
    .returning();

  revalidateTag("profiles");
  revalidatePath("/");
  revalidatePath("/settings/profile");
  if (previousHandle) revalidatePath(`/u/${previousHandle}`);
  if (updated.handle) revalidatePath(`/u/${updated.handle}`);

  return { ok: true, handle: updated.handle };
}
