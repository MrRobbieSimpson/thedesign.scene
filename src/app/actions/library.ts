"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { content, sceneItems, scenes, saves } from "@/db/schema";
import { requireProfile } from "@/lib/auth";

export async function toggleSave(contentId: string) {
  if (!db) return { ok: false as const, message: "Database not configured." };

  const profile = await requireProfile();

  const existing = await db.query.saves.findFirst({
    where: and(
      eq(saves.profileId, profile.id),
      eq(saves.contentId, contentId)
    ),
  });

  if (existing) {
    await db.delete(saves).where(eq(saves.id, existing.id));
    revalidatePath("/saves");
    return { ok: true as const, saved: false };
  }

  await db.insert(saves).values({
    profileId: profile.id,
    contentId,
  });
  revalidatePath("/saves");
  return { ok: true as const, saved: true };
}

export async function isSaved(contentId: string) {
  if (!db) return false;
  try {
    const profile = await requireProfile();
    const existing = await db.query.saves.findFirst({
      where: and(
        eq(saves.profileId, profile.id),
        eq(saves.contentId, contentId)
      ),
    });
    return Boolean(existing);
  } catch {
    return false;
  }
}

export async function getSavedContent() {
  if (!db) return [];
  const profile = await requireProfile();

  const rows = await db.query.saves.findMany({
    where: eq(saves.profileId, profile.id),
    with: {
      content: { with: { maker: true } },
    },
    orderBy: [desc(saves.createdAt)],
  });

  return rows
    .map((row) => row.content)
    .filter((item) => item && item.status === "published");
}

export async function createScene(formData: FormData) {
  if (!db) return { ok: false as const, message: "Database not configured." };
  const profile = await requireProfile();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!title) return { ok: false as const, message: "Title is required." };

  const [scene] = await db
    .insert(scenes)
    .values({
      profileId: profile.id,
      title,
      description,
    })
    .returning();

  revalidatePath("/scenes");
  return { ok: true as const, id: scene.id };
}

export async function getUserScenes() {
  if (!db) return [];
  const profile = await requireProfile();
  return db.query.scenes.findMany({
    where: eq(scenes.profileId, profile.id),
    orderBy: [desc(scenes.updatedAt)],
    with: {
      items: true,
    },
  });
}

export async function getSceneById(id: string) {
  if (!db) return null;
  const profile = await requireProfile();
  const scene = await db.query.scenes.findFirst({
    where: and(eq(scenes.id, id), eq(scenes.profileId, profile.id)),
    with: {
      items: {
        orderBy: [asc(sceneItems.position)],
        with: {
          content: { with: { maker: true } },
        },
      },
    },
  });
  return scene ?? null;
}

export async function addToScene(sceneId: string, contentId: string) {
  if (!db) return { ok: false as const, message: "Database not configured." };
  const profile = await requireProfile();

  const scene = await db.query.scenes.findFirst({
    where: and(eq(scenes.id, sceneId), eq(scenes.profileId, profile.id)),
    with: { items: true },
  });
  if (!scene) return { ok: false as const, message: "Scene not found." };

  await db
    .insert(sceneItems)
    .values({
      sceneId,
      contentId,
      position: scene.items.length,
    })
    .onConflictDoNothing();

  revalidatePath(`/scenes/${sceneId}`);
  revalidatePath("/scenes");
  return { ok: true as const };
}

export async function removeFromScene(sceneId: string, contentId: string) {
  if (!db) return { ok: false as const, message: "Database not configured." };
  const profile = await requireProfile();

  const scene = await db.query.scenes.findFirst({
    where: and(eq(scenes.id, sceneId), eq(scenes.profileId, profile.id)),
  });
  if (!scene) return { ok: false as const, message: "Scene not found." };

  await db
    .delete(sceneItems)
    .where(
      and(eq(sceneItems.sceneId, sceneId), eq(sceneItems.contentId, contentId))
    );

  revalidatePath(`/scenes/${sceneId}`);
  return { ok: true as const };
}

export async function listPublishedContentIds() {
  if (!db) return [];
  const rows = await db.query.content.findMany({
    where: eq(content.status, "published"),
    columns: { id: true, title: true },
    orderBy: [desc(content.publishedAt)],
    limit: 50,
  });
  return rows;
}
