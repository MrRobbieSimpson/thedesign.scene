import Parser from "rss-parser";

import type { RssCandidate } from "@/lib/ingest/types";

const parser = new Parser({
  customFields: {
    item: ["media:content", "media:thumbnail"],
  },
});

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function firstImage(item: Parser.Item) {
  const record = item as Parser.Item & {
    "media:content"?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
    "media:thumbnail"?: { $?: { url?: string } };
    "content:encoded"?: string;
  };

  if (item.enclosure?.url && item.enclosure.type?.startsWith("image")) {
    return item.enclosure.url;
  }
  if (
    typeof item.enclosure?.url === "string" &&
    /\.(png|jpe?g|webp|gif)/i.test(item.enclosure.url)
  ) {
    return item.enclosure.url;
  }

  const mediaContent = record["media:content"];

  if (Array.isArray(mediaContent)) {
    const url = mediaContent[0]?.$?.url;
    if (url) return url;
  } else if (mediaContent?.$?.url) {
    return mediaContent.$.url;
  }

  const thumb = record["media:thumbnail"];
  if (thumb?.$?.url) return thumb.$.url;

  const html = record["content:encoded"] ?? item.content ?? item.contentSnippet;
  if (typeof html === "string") {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) return match[1];
  }

  return null;
}

export async function fetchRssCandidates(
  feedUrl: string,
  limit = 12
): Promise<RssCandidate[]> {
  const feed = await parser.parseURL(feedUrl);

  return (feed.items ?? [])
    .slice(0, limit)
    .map((item) => {
      const url = item.link ?? item.guid ?? "";
      const rawExcerpt =
        item.contentSnippet ??
        (typeof item.content === "string" ? stripHtml(item.content) : null) ??
        null;

      return {
        title: item.title?.trim() || "Untitled",
        url,
        excerpt: rawExcerpt ? stripHtml(rawExcerpt).slice(0, 320) : null,
        image: firstImage(item),
        externalId: String(item.guid ?? item.link ?? item.title ?? crypto.randomUUID()),
        publishedAt: item.isoDate ? new Date(item.isoDate) : null,
        authorName: item.creator ?? (item as { author?: string }).author ?? null,
      } satisfies RssCandidate;
    })
    .filter((item) => Boolean(item.url));
}
