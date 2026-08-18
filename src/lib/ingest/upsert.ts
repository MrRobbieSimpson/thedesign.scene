import { and, eq } from "drizzle-orm";

import { db, isDatabaseConfigured } from "@/db";
import { content, type ContentType, type NewContent } from "@/db/schema";
import type { ResolvedImport, RssCandidate } from "@/lib/ingest/types";
import type { FeedSource } from "@/lib/ingest/sources";

export type ImportResult =
  | { ok: true; id: string; created: boolean }
  | { ok: false; message: string };

function requireDb() {
  if (!isDatabaseConfigured() || !db) {
    return {
      ok: false as const,
      message:
        "Database not configured. Add DATABASE_URL to .env.local before importing.",
    };
  }
  return null;
}

async function findExisting(platform: string, externalId: string | null) {
  if (!db || !externalId) return null;
  return db.query.content.findFirst({
    where: and(
      eq(content.sourcePlatform, platform),
      eq(content.externalId, externalId)
    ),
  });
}

export async function insertResolvedDraft(
  resolved: ResolvedImport,
  overrides?: Partial<Pick<NewContent, "type" | "status" | "featured" | "title" | "excerpt" | "image">>
): Promise<ImportResult> {
  const missing = requireDb();
  if (missing) return missing;

  const existing = await findExisting(
    resolved.sourcePlatform,
    resolved.externalId
  );
  if (existing) {
    return { ok: true, id: existing.id, created: false };
  }

  const type = (overrides?.type ?? resolved.type) as ContentType;
  const status = overrides?.status ?? "draft";

  const [row] = await db!
    .insert(content)
    .values({
      type,
      title: overrides?.title ?? resolved.title,
      excerpt: overrides?.excerpt ?? resolved.excerpt,
      image: overrides?.image ?? resolved.image,
      url: resolved.url,
      sourceUrl: resolved.sourceUrl,
      sourcePlatform: resolved.sourcePlatform,
      externalId: resolved.externalId,
      authorHandle: resolved.authorHandle,
      authorName: resolved.authorName,
      sourcePayload: resolved.sourcePayload,
      status,
      featured: overrides?.featured ?? false,
      publishedAt: status === "published" ? new Date() : null,
    })
    .returning({ id: content.id });

  return { ok: true, id: row.id, created: true };
}

export async function insertRssDrafts(
  source: FeedSource,
  items: RssCandidate[]
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const missing = requireDb();
  if (missing) {
    return { imported: 0, skipped: 0, errors: [missing.message] };
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      const existing = await findExisting(source.platform, item.externalId);
      if (existing) {
        skipped += 1;
        continue;
      }

      await db!.insert(content).values({
        type: source.defaultType,
        title: item.title,
        excerpt: item.excerpt,
        image: item.image,
        url: item.url,
        sourceUrl: item.url,
        sourcePlatform: source.platform,
        externalId: item.externalId,
        authorHandle: null,
        authorName: item.authorName ?? source.name,
        status: "draft",
        featured: false,
        publishedAt: null,
      });
      imported += 1;
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : `Failed: ${item.title}`
      );
    }
  }

  return { imported, skipped, errors };
}
