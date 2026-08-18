"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db, isDatabaseConfigured } from "@/db";
import {
  content,
  isContentType,
  type ContentStatus,
  type ContentType,
} from "@/db/schema";
import { resolveImportUrl } from "@/lib/ingest/resolve";
import { fetchRssCandidates } from "@/lib/ingest/rss";
import { getFeedSource } from "@/lib/ingest/sources";
import { insertResolvedDraft, insertRssDrafts } from "@/lib/ingest/upsert";
import type { ResolvedImport } from "@/lib/ingest/types";

export type ActionResult = {
  ok: boolean;
  message: string;
};

function requireDb(): ActionResult | null {
  if (!isDatabaseConfigured() || !db) {
    return {
      ok: false,
      message:
        "Database not configured. Add DATABASE_URL to .env.local, run migrations, then try again.",
    };
  }
  return null;
}

export async function createContent(formData: FormData): Promise<ActionResult> {
  const missing = requireDb();
  if (missing) return missing;

  const title = String(formData.get("title") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const url = String(formData.get("url") ?? "").trim() || null;
  const image = String(formData.get("image") ?? "").trim() || null;
  const status = (String(formData.get("status") ?? "draft") ||
    "draft") as ContentStatus;
  const featured = formData.get("featured") === "on";
  const sourcePlatform =
    String(formData.get("sourcePlatform") ?? "").trim() || null;
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim() || url;
  const authorHandle =
    String(formData.get("authorHandle") ?? "").trim().replace(/^@/, "") ||
    null;
  const authorName = String(formData.get("authorName") ?? "").trim() || null;

  if (!title) {
    return { ok: false, message: "Title is required." };
  }

  if (!isContentType(typeRaw)) {
    return { ok: false, message: "Invalid content type." };
  }

  const type = typeRaw as ContentType;
  const publishedAt = status === "published" ? new Date() : null;

  await db!.insert(content).values({
    title,
    type,
    excerpt,
    url,
    image,
    status,
    featured,
    publishedAt,
    sourcePlatform,
    sourceUrl,
    authorHandle,
    authorName,
  });

  revalidatePath("/");
  revalidatePath("/admin");

  return { ok: true, message: "Content created." };
}

export async function setContentStatus(
  id: string,
  status: ContentStatus
): Promise<ActionResult> {
  const missing = requireDb();
  if (missing) return missing;

  await db!
    .update(content)
    .set({
      status,
      publishedAt: status === "published" ? new Date() : null,
    })
    .where(eq(content.id, id));

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/content/${id}`);

  return {
    ok: true,
    message: status === "published" ? "Published." : "Unpublished.",
  };
}

export async function previewImportUrl(
  url: string
): Promise<
  | { ok: true; data: ResolvedImport }
  | { ok: false; message: string }
> {
  try {
    const data = await resolveImportUrl(url);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not resolve that URL.",
    };
  }
}

export async function confirmImportUrl(formData: FormData): Promise<ActionResult> {
  const url = String(formData.get("url") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const image = String(formData.get("image") ?? "").trim() || null;

  if (!url) return { ok: false, message: "URL is required." };

  try {
    const resolved = await resolveImportUrl(url);
    const result = await insertResolvedDraft(resolved, {
      type: isContentType(typeRaw) ? typeRaw : resolved.type,
      title: title || resolved.title,
      excerpt: excerpt ?? resolved.excerpt,
      image: image ?? resolved.image,
      status: "draft",
    });

    if (!result.ok) return result;

    revalidatePath("/admin");
    revalidatePath("/");

    return {
      ok: true,
      message: result.created
        ? "Imported as draft."
        : "Already imported — opened existing item.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Import failed.",
    };
  }
}

export async function loadRssSource(sourceId: string, limit = 10) {
  const source = getFeedSource(sourceId);
  if (!source) {
    return { ok: false as const, message: "Unknown source." };
  }

  try {
    const items = await fetchRssCandidates(source.feedUrl, limit);
    return { ok: true as const, source, items };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error ? error.message : "Failed to load RSS feed.",
    };
  }
}

export async function importRssSelection(
  sourceId: string,
  externalIds: string[]
): Promise<ActionResult> {
  const source = getFeedSource(sourceId);
  if (!source) return { ok: false, message: "Unknown source." };

  try {
    const items = await fetchRssCandidates(source.feedUrl, 30);
    const selected = items.filter((item) =>
      externalIds.includes(item.externalId)
    );
    const result = await insertRssDrafts(source, selected);

    revalidatePath("/admin");
    revalidatePath("/");

    if (result.errors.length && result.imported === 0) {
      return { ok: false, message: result.errors[0] };
    }

    return {
      ok: true,
      message: `Imported ${result.imported}, skipped ${result.skipped}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "RSS import failed.",
    };
  }
}
