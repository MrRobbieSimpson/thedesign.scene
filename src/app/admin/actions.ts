"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

import { db, isDatabaseConfigured } from "@/db";
import {
  content,
  events,
  isContentType,
  isPublicContentType,
  jobs,
  type ContentStatus,
  type ContentType,
  type EventStatus,
  type EventType,
  type JobStatus,
  type JobWorkMode,
} from "@/db/schema";
import { geocodeLocation } from "@/lib/geo";
import {
  eventNeedsDates,
  resolveEventUrl,
  type ResolvedEvent,
} from "@/lib/ingest/event-resolve";
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

async function requireAdminAccess(): Promise<ActionResult | null> {
  try {
    const { requireAdmin } = await import("@/lib/auth");
    await requireAdmin();
    return null;
  } catch {
    return { ok: false, message: "You don’t have access to curate." };
  }
}

export async function createContent(formData: FormData): Promise<ActionResult> {
  const missing = requireDb();
  if (missing) return missing;

  const forbidden = await requireAdminAccess();
  if (forbidden) return forbidden;

  const { readingTimeMinutes, slugify } = await import("@/lib/slug");

  const title = String(formData.get("title") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const url = String(formData.get("url") ?? "").trim() || null;
  const image = String(formData.get("image") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim() || null;
  const makerId = String(formData.get("makerId") ?? "").trim() || null;
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
  let slug = String(formData.get("slug") ?? "").trim() || null;

  if (!title) {
    return { ok: false, message: "Title is required." };
  }

  if (!isPublicContentType(typeRaw) && !isContentType(typeRaw)) {
    return { ok: false, message: "Invalid content type." };
  }
  if (typeRaw === "build" || !isPublicContentType(typeRaw)) {
    return { ok: false, message: "Invalid content type." };
  }

  const type = typeRaw as ContentType;
  const editorNote =
    String(formData.get("editorNote") ?? "").trim().slice(0, 280) || null;
  const publishedAt = status === "published" ? new Date() : null;

  if (type === "article") {
    slug = slugify(slug || title);
    if (!slug) {
      return { ok: false, message: "Writing needs a valid slug." };
    }
  } else {
    slug = null;
  }

  try {
    await db!.insert(content).values({
      title,
      type,
      slug,
      body: type === "article" ? body : null,
      readingTimeMinutes:
        type === "article" && body ? readingTimeMinutes(body) : null,
      excerpt,
      url,
      image,
      status,
      featured,
      editorNote: featured ? editorNote : null,
      makerId,
      publishedAt,
      sourcePlatform,
      sourceUrl,
      authorHandle,
      authorName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed.";
    if (message.toLowerCase().includes("unique")) {
      return { ok: false, message: "That slug is already in use." };
    }
    return { ok: false, message };
  }

  revalidatePath("/");
  revalidateTag("content");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/article/${slug}`);

  return { ok: true, message: "Content created." };
}

export async function setContentStatus(
  id: string,
  status: ContentStatus
): Promise<ActionResult> {
  const missing = requireDb();
  if (missing) return missing;

  const forbidden = await requireAdminAccess();
  if (forbidden) return forbidden;

  await db!
    .update(content)
    .set({
      status,
      publishedAt: status === "published" ? new Date() : null,
    })
    .where(eq(content.id, id));

  revalidatePath("/");
  revalidateTag("content");
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
  const forbidden = await requireAdminAccess();
  if (forbidden) return { ok: false as const, message: forbidden.message };

  try {
    const data = await resolveImportUrl(url);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error ? error.message : "Could not resolve that URL.",
    };
  }
}

export async function confirmImportUrl(formData: FormData): Promise<ActionResult> {
  const forbidden = await requireAdminAccess();
  if (forbidden) return forbidden;

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
    revalidateTag("content");

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
  const forbidden = await requireAdminAccess();
  if (forbidden) return { ok: false as const, message: forbidden.message };

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
  const forbidden = await requireAdminAccess();
  if (forbidden) return forbidden;

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
    revalidateTag("content");

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

export async function previewEventUrl(url: string): Promise<
  | { ok: true; data: ResolvedEvent; needsDates: boolean }
  | { ok: false; message: string }
> {
  const forbidden = await requireAdminAccess();
  if (forbidden) return { ok: false as const, message: forbidden.message };

  try {
    const data = await resolveEventUrl(url);
    return { ok: true, data, needsDates: eventNeedsDates(data) };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error ? error.message : "Could not resolve that event URL.",
    };
  }
}

export async function confirmEventImport(
  formData: FormData
): Promise<ActionResult> {
  const missing = requireDb();
  if (missing) return missing;

  const forbidden = await requireAdminAccess();
  if (forbidden) return forbidden;

  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { ok: false, message: "URL is required." };

  try {
    const resolved = await resolveEventUrl(url);
    const title = String(formData.get("title") ?? "").trim() || resolved.title;
    const description =
      String(formData.get("description") ?? "").trim() || resolved.description;
    const location =
      String(formData.get("location") ?? "").trim() || resolved.location;
    const typeRaw = String(formData.get("type") ?? resolved.type);
    const type = (["in-person", "hybrid", "remote"].includes(typeRaw)
      ? typeRaw
      : "in-person") as EventType;

    const startRaw = String(formData.get("startDate") ?? "").trim();
    const endRaw = String(formData.get("endDate") ?? "").trim();

    let startDate = resolved.startDate;
    let endDate = resolved.endDate;

    if (startRaw) startDate = new Date(startRaw);
    if (endRaw) endDate = new Date(endRaw);

    if (Number.isNaN(startDate.getTime())) {
      return {
        ok: false,
        message: "Start date is required (page had no structured event dates).",
      };
    }

    const latRaw = String(formData.get("latitude") ?? "").trim();
    const lngRaw = String(formData.get("longitude") ?? "").trim();
    let latitude = latRaw ? Number(latRaw) : null;
    let longitude = lngRaw ? Number(lngRaw) : null;

    if (
      (latitude == null || longitude == null || Number.isNaN(latitude) || Number.isNaN(longitude)) &&
      location
    ) {
      const geo = await geocodeLocation(location);
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
      }
    }

    const existing = await db!.query.events.findFirst({
      where: and(
        eq(events.sourcePlatform, resolved.sourcePlatform),
        eq(events.externalId, resolved.externalId)
      ),
    });
    if (existing) {
      return { ok: true, message: "Already imported — skipped duplicate." };
    }

    await db!.insert(events).values({
      title,
      description,
      url: resolved.url,
      location,
      latitude: latitude != null && !Number.isNaN(latitude) ? latitude : null,
      longitude:
        longitude != null && !Number.isNaN(longitude) ? longitude : null,
      startDate,
      endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate : null,
      type,
      status: "draft",
      sourcePlatform: resolved.sourcePlatform,
      sourceUrl: resolved.sourceUrl,
      externalId: resolved.externalId,
      sourcePayload: resolved.sourcePayload,
    });

    revalidatePath("/admin");
    revalidatePath("/events");
    revalidateTag("events");
    return { ok: true, message: "Event imported as draft." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Event import failed.",
    };
  }
}

export async function createEvent(formData: FormData): Promise<ActionResult> {
  const missing = requireDb();
  if (missing) return missing;

  const forbidden = await requireAdminAccess();
  if (forbidden) return forbidden;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const url = String(formData.get("url") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const typeRaw = String(formData.get("type") ?? "in-person");
  const status = (String(formData.get("status") ?? "draft") ||
    "draft") as EventStatus;
  const startRaw = String(formData.get("startDate") ?? "").trim();
  const endRaw = String(formData.get("endDate") ?? "").trim();

  if (!title) return { ok: false, message: "Title is required." };
  if (!startRaw) return { ok: false, message: "Start date is required." };

  const startDate = new Date(startRaw);
  if (Number.isNaN(startDate.getTime())) {
    return { ok: false, message: "Invalid start date." };
  }

  const type = (["in-person", "hybrid", "remote"].includes(typeRaw)
    ? typeRaw
    : "in-person") as EventType;

  const endDate = endRaw ? new Date(endRaw) : null;

  await db!.insert(events).values({
    title,
    description,
    url,
    location,
    startDate,
    endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate : null,
    type,
    status,
  });

  revalidatePath("/admin");
  revalidatePath("/events");
  revalidateTag("events");
  return { ok: true, message: "Event created." };
}

export async function setEventStatus(
  id: string,
  status: EventStatus
): Promise<ActionResult> {
  const missing = requireDb();
  if (missing) return missing;

  const forbidden = await requireAdminAccess();
  if (forbidden) return forbidden;

  await db!.update(events).set({ status }).where(eq(events.id, id));

  revalidatePath("/admin");
  revalidatePath("/events");
  revalidateTag("events");
  return {
    ok: true,
    message: status === "published" ? "Published." : "Unpublished.",
  };
}

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function createJob(formData: FormData): Promise<ActionResult> {
  const missing = requireDb();
  if (missing) return missing;

  const forbidden = await requireAdminAccess();
  if (forbidden) return forbidden;

  const title = String(formData.get("title") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const description =
    String(formData.get("description") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const editorNote =
    String(formData.get("editorNote") ?? "").trim() || null;
  const roleKind = String(formData.get("roleKind") ?? "").trim() || null;
  const workModeRaw = String(formData.get("workMode") ?? "remote");
  const url = normalizeUrl(String(formData.get("url") ?? ""));
  const companyUrl = normalizeUrl(String(formData.get("companyUrl") ?? ""));

  if (!title) return { ok: false, message: "Title is required." };
  if (!company) return { ok: false, message: "Company is required." };

  const workMode = (
    ["remote", "hybrid", "onsite"].includes(workModeRaw)
      ? workModeRaw
      : "remote"
  ) as JobWorkMode;

  await db!.insert(jobs).values({
    title,
    company,
    description,
    location,
    editorNote,
    roleKind,
    workMode,
    url,
    companyUrl,
    status: "draft",
  });

  revalidatePath("/admin");
  revalidatePath("/jobs");
  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidateTag("jobs");
  return {
    ok: true,
    message: editorNote
      ? "Opening saved as draft."
      : "Opening saved as draft — consider adding “Why this is here” before publishing.",
  };
}

export async function setJobStatus(
  id: string,
  status: JobStatus
): Promise<ActionResult> {
  const missing = requireDb();
  if (missing) return missing;

  const forbidden = await requireAdminAccess();
  if (forbidden) return forbidden;

  const existing = await db!.query.jobs.findFirst({
    where: eq(jobs.id, id),
    columns: { publishedAt: true },
  });

  await db!
    .update(jobs)
    .set({
      status,
      publishedAt:
        status === "published"
          ? existing?.publishedAt ?? new Date()
          : existing?.publishedAt ?? null,
    })
    .where(eq(jobs.id, id));

  revalidatePath("/admin");
  revalidatePath("/jobs");
  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidateTag("jobs");
  return {
    ok: true,
    message:
      status === "published"
        ? "Published."
        : status === "closed"
          ? "Closed."
          : status === "pending_review"
            ? "Moved to review."
            : "Unpublished.",
  };
}
