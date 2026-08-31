/**
 * High-bar writing ingest → Admin drafts only.
 * Never auto-publishes, never features, never pulls news/visual firehoses.
 */

import { fetchRssCandidates } from "@/lib/ingest/rss";
import { getWritingSources, type FeedSource } from "@/lib/ingest/sources";
import type { RssCandidate } from "@/lib/ingest/types";
import { insertRssDrafts } from "@/lib/ingest/upsert";

/** Noisy / high-volume writing feeds — excluded from the daily cron. */
const CRON_EXCLUDED_SOURCE_IDS = new Set([
  "uxdesign",
  "dribbble-stories",
  "medium-product-design",
]);

const PER_SOURCE_LIMIT = 2;
const GLOBAL_IMPORT_CAP = 10;
const MIN_EXCERPT_CHARS = 100;

export type WritingDraftPullResult = {
  imported: number;
  skipped: number;
  rejected: number;
  errors: string[];
  bySource: Record<
    string,
    { imported: number; skipped: number; rejected: number; errors: string[] }
  >;
  sourcesConsidered: string[];
};

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function passesQualityGate(item: RssCandidate): boolean {
  if (!item.title?.trim() || item.title === "Untitled") return false;
  if (!item.url || !isHttpUrl(item.url)) return false;
  const excerpt = item.excerpt?.trim() ?? "";
  return excerpt.length >= MIN_EXCERPT_CHARS;
}

export function getHighBarWritingSources(): FeedSource[] {
  return getWritingSources().filter(
    (source) => !CRON_EXCLUDED_SOURCE_IDS.has(source.id)
  );
}

/**
 * Pull curated writing RSS into drafts.
 * Caps per source and globally; quality-gates on title + substance excerpt.
 */
export async function pullWritingDrafts(options?: {
  dryRun?: boolean;
  perSourceLimit?: number;
  globalCap?: number;
}): Promise<WritingDraftPullResult> {
  const perSourceLimit = options?.perSourceLimit ?? PER_SOURCE_LIMIT;
  const globalCap = options?.globalCap ?? GLOBAL_IMPORT_CAP;
  const dryRun = options?.dryRun ?? false;

  const sources = getHighBarWritingSources();
  const result: WritingDraftPullResult = {
    imported: 0,
    skipped: 0,
    rejected: 0,
    errors: [],
    bySource: {},
    sourcesConsidered: sources.map((s) => s.id),
  };

  for (const source of sources) {
    if (result.imported >= globalCap) break;

    const slot = {
      imported: 0,
      skipped: 0,
      rejected: 0,
      errors: [] as string[],
    };
    result.bySource[source.id] = slot;

    let candidates: RssCandidate[] = [];
    try {
      candidates = await fetchRssCandidates(source.feedUrl, perSourceLimit);
    } catch (error) {
      const message =
        error instanceof Error
          ? `${source.id}: ${error.message}`
          : `${source.id}: fetch failed`;
      slot.errors.push(message);
      result.errors.push(message);
      continue;
    }

    const accepted: RssCandidate[] = [];
    for (const item of candidates) {
      if (!passesQualityGate(item)) {
        slot.rejected += 1;
        result.rejected += 1;
        continue;
      }
      accepted.push(item);
    }

    if (accepted.length === 0) continue;

    const remaining = globalCap - result.imported;
    const batch = accepted.slice(0, Math.min(perSourceLimit, remaining));

    if (dryRun) {
      slot.imported += batch.length;
      result.imported += batch.length;
      continue;
    }

    const insert = await insertRssDrafts(source, batch);
    slot.imported += insert.imported;
    slot.skipped += insert.skipped;
    slot.errors.push(...insert.errors);
    result.imported += insert.imported;
    result.skipped += insert.skipped;
    result.errors.push(...insert.errors.map((e) => `${source.id}: ${e}`));
  }

  return result;
}
