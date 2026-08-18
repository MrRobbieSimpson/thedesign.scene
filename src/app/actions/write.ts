"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { content } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { readingTimeMinutes, slugify } from "@/lib/slug";

export type WritePayload = {
  id?: string;
  title: string;
  body: string;
  excerpt?: string;
  status?: "draft" | "published";
};

export async function saveArticleDraft(payload: WritePayload) {
  if (!db) return { ok: false as const, message: "Database not configured." };

  const profile = await requireProfile();
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
  const status = payload.status ?? "draft";
  const slugBase = slugify(title) || `draft-${Date.now()}`;
  const minutes = body ? readingTimeMinutes(body) : null;

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

    let slug = existing.slug ?? slugBase;
    if (status === "published" && !existing.slug) {
      slug = slugBase;
    }

    const [updated] = await db
      .update(content)
      .set({
        title,
        body,
        excerpt,
        slug,
        readingTimeMinutes: minutes,
        status,
        type: "article",
        publishedAt:
          status === "published"
            ? existing.publishedAt ?? new Date()
            : existing.publishedAt,
      })
      .where(eq(content.id, existing.id))
      .returning();

    revalidatePath("/");
    revalidatePath("/drafts");
    if (updated.slug) revalidatePath(`/article/${updated.slug}`);

    return {
      ok: true as const,
      id: updated.id,
      slug: updated.slug,
      status: updated.status,
    };
  }

  const [created] = await db
    .insert(content)
    .values({
      type: "article",
      title,
      body,
      excerpt,
      slug: status === "published" ? slugBase : slugBase,
      readingTimeMinutes: minutes,
      status,
      featured: false,
      authorProfileId: profile.id,
      authorName: profile.displayName,
      authorHandle: profile.handle,
      publishedAt: status === "published" ? new Date() : null,
    })
    .returning();

  revalidatePath("/");
  revalidatePath("/drafts");
  if (created.slug) revalidatePath(`/article/${created.slug}`);

  return {
    ok: true as const,
    id: created.id,
    slug: created.slug,
    status: created.status,
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
