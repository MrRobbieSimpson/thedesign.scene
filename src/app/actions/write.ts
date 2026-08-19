"use server";

import { and, eq, ne, desc } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

import { db } from "@/db";
import { content, profiles, type Profile } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { readingTimeMinutes, slugify } from "@/lib/slug";

export type WritePayload = {
  id?: string;
  title: string;
  body: string;
  excerpt?: string;
  image?: string;
  status?: "draft" | "published";
};

async function ensureProfileHandle(profile: Profile): Promise<Profile> {
  if (profile.handle) return profile;
  if (!db) return profile;

  const base =
    slugify(profile.displayName ?? "") ||
    slugify(profile.clerkUserId.slice(0, 12)) ||
    "writer";

  let candidate = base;
  let n = 2;
  while (true) {
    const taken = await db.query.profiles.findFirst({
      where: and(
        eq(profiles.handle, candidate),
        ne(profiles.id, profile.id)
      ),
      columns: { id: true },
    });
    if (!taken) break;
    candidate = `${base}-${n}`;
    n += 1;
  }

  const [updated] = await db
    .update(profiles)
    .set({ handle: candidate })
    .where(eq(profiles.id, profile.id))
    .returning();

  revalidateTag("profiles");
  return updated ?? { ...profile, handle: candidate };
}

async function uniqueContentSlug(base: string, excludeId?: string) {
  if (!db) return base;

  let candidate = base;
  let n = 2;
  while (true) {
    const existing = await db.query.content.findFirst({
      where: excludeId
        ? and(eq(content.slug, candidate), ne(content.id, excludeId))
        : eq(content.slug, candidate),
      columns: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

export async function saveArticleDraft(payload: WritePayload) {
  if (!db) return { ok: false as const, message: "Database not configured." };

  let profile = await requireProfile();
  profile = await ensureProfileHandle(profile);

  const title = payload.title.trim() || "Untitled";
  const body = payload.body.trim();
  const excerpt =
    payload.excerpt?.trim() ||
    body
      .replace(/[#>*_`~\-\[\]\(\)!]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 40)
      .join(" ") ||
    null;
  const image = payload.image?.trim() || null;
  const status = payload.status ?? "draft";
  const slugBase = slugify(title) || `draft-${Date.now()}`;
  const minutes = body ? readingTimeMinutes(body) : null;
  const handle = profile.handle;

  if (payload.id) {
    const existing = await db.query.content.findFirst({
      where: and(
        eq(content.id, payload.id),
        eq(content.authorProfileId, profile.id)
      ),
    });
    if (!existing) {
      return { ok: false as const, message: "Draft not found." };
    }

    const slug = existing.slug
      ? status === "published"
        ? await uniqueContentSlug(existing.slug, existing.id)
        : existing.slug
      : await uniqueContentSlug(slugBase, existing.id);

    const [updated] = await db
      .update(content)
      .set({
        title,
        body,
        excerpt,
        image: image ?? existing.image,
        slug,
        readingTimeMinutes: minutes,
        status,
        type: "article",
        authorName: profile.displayName,
        authorHandle: handle,
        publishedAt:
          status === "published"
            ? existing.publishedAt ?? new Date()
            : existing.publishedAt,
      })
      .where(eq(content.id, existing.id))
      .returning();

    revalidatePath("/");
    revalidateTag("content");
    revalidatePath("/drafts");
    if (updated.slug) revalidatePath(`/article/${updated.slug}`);
    if (status === "published" && handle) {
      revalidatePath(`/u/${handle}`);
    }

    return {
      ok: true as const,
      id: updated.id,
      slug: updated.slug,
      status: updated.status,
      handle,
    };
  }

  const slug =
    status === "published"
      ? await uniqueContentSlug(slugBase)
      : await uniqueContentSlug(slugBase);

  const [created] = await db
    .insert(content)
    .values({
      type: "article",
      title,
      body,
      excerpt,
      image,
      slug,
      readingTimeMinutes: minutes,
      status,
      featured: false,
      authorProfileId: profile.id,
      authorName: profile.displayName,
      authorHandle: handle,
      publishedAt: status === "published" ? new Date() : null,
    })
    .returning();

  revalidatePath("/");
  revalidateTag("content");
  revalidatePath("/drafts");
  if (created.slug) revalidatePath(`/article/${created.slug}`);
  if (status === "published" && handle) {
    revalidatePath(`/u/${handle}`);
  }

  return {
    ok: true as const,
    id: created.id,
    slug: created.slug,
    status: created.status,
    handle,
  };
}

export async function getMyDraft(id: string) {
  if (!db) return null;
  const profile = await requireProfile();
  return (
    (await db.query.content.findFirst({
      where: and(
        eq(content.id, id),
        eq(content.authorProfileId, profile.id)
      ),
    })) ?? null
  );
}

export async function getMyDrafts() {
  if (!db) return [];
  const profile = await requireProfile();
  return db.query.content.findMany({
    where: and(
      eq(content.authorProfileId, profile.id),
      eq(content.type, "article")
    ),
    orderBy: [desc(content.updatedAt)],
  });
}

export async function deleteMyDraft(id: string) {
  if (!db) return { ok: false as const, message: "Database not configured." };
  const profile = await requireProfile();
  await db
    .delete(content)
    .where(
      and(eq(content.id, id), eq(content.authorProfileId, profile.id))
    );
  revalidatePath("/drafts");
  return { ok: true as const };
}
