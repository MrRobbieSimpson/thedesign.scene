import type { EventType } from "@/db/schema";

export type ResolvedEvent = {
  title: string;
  description: string | null;
  url: string;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  type: EventType;
  sourcePlatform: string;
  sourceUrl: string;
  externalId: string;
  sourcePayload?: Record<string, unknown>;
};

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function metaContent(html: string, keys: string[]) {
  for (const key of keys) {
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
        "i"
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
        "i"
      ),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeEntities(match[1].trim());
    }
  }
  return null;
}

function titleTag(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeEntities(match[1].trim()) : null;
}

function parseJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return blocks;
}

type JsonLdEvent = {
  "@type"?: string | string[];
  name?: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  eventAttendanceMode?: string;
  location?:
    | string
    | {
        name?: string;
        address?: string | { name?: string; addressLocality?: string; addressCountry?: string };
      };
};

function isEventNode(node: unknown): node is JsonLdEvent {
  if (!node || typeof node !== "object") return false;
  const type = (node as JsonLdEvent)["@type"];
  if (!type) return false;
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => String(t).toLowerCase().includes("event"));
}

function flattenNodes(nodes: unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const record = node as Record<string, unknown>;
    if (Array.isArray(record["@graph"])) {
      out.push(...flattenNodes(record["@graph"]));
    } else {
      out.push(node);
    }
  }
  return out;
}

function locationFromJsonLd(location: JsonLdEvent["location"]): string | null {
  if (!location) return null;
  if (typeof location === "string") return location;
  if (location.name) return location.name;
  if (typeof location.address === "string") return location.address;
  if (location.address && typeof location.address === "object") {
    const parts = [
      location.address.name,
      location.address.addressLocality,
      location.address.addressCountry,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }
  return null;
}

function eventTypeFromMode(mode?: string, location?: string | null): EventType {
  const m = (mode ?? "").toLowerCase();
  if (m.includes("online") || m.includes("virtual")) return "remote";
  if (m.includes("mixed") || m.includes("hybrid")) return "hybrid";
  if (location && /online|virtual|remote/i.test(location)) return "remote";
  return "in-person";
}

function hostPlatform(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

/**
 * Resolve a conference / meetup URL into structured event fields.
 * Prefers schema.org JSON-LD Event; falls back to Open Graph + manual date prompts.
 */
export async function resolveEventUrl(inputUrl: string): Promise<ResolvedEvent> {
  const trimmed = inputUrl.trim();
  if (!trimmed) throw new Error("URL is required");

  const response = await fetch(trimmed, {
    headers: {
      "User-Agent":
        "thedesign.scene/1.0 (+https://thedesign.scene; curated design platform)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch event URL (${response.status})`);
  }

  const html = await response.text();
  const canonical =
    metaContent(html, ["og:url"]) ?? response.url ?? trimmed;
  const nodes = flattenNodes(parseJsonLdBlocks(html));
  const eventNode = nodes.find(isEventNode);

  const ogTitle = metaContent(html, ["og:title", "twitter:title"]) ?? titleTag(html);
  const ogDescription = metaContent(html, [
    "og:description",
    "twitter:description",
    "description",
  ]);

  if (eventNode?.startDate) {
    const startDate = new Date(eventNode.startDate);
    if (Number.isNaN(startDate.getTime())) {
      throw new Error("Event page has an invalid startDate");
    }
    const endDate = eventNode.endDate ? new Date(eventNode.endDate) : null;
    const location = locationFromJsonLd(eventNode.location);

    return {
      title: (eventNode.name ?? ogTitle ?? "Untitled event").slice(0, 200),
      description: (eventNode.description ?? ogDescription)?.slice(0, 800) ?? null,
      url: eventNode.url ?? canonical,
      location,
      startDate,
      endDate:
        endDate && !Number.isNaN(endDate.getTime()) ? endDate : null,
      type: eventTypeFromMode(eventNode.eventAttendanceMode, location),
      sourcePlatform: hostPlatform(canonical),
      sourceUrl: canonical,
      externalId: canonical,
      sourcePayload: { jsonLd: eventNode },
    };
  }

  // Fallback: OG only — caller must supply dates in the admin form
  const title = (ogTitle ?? "Untitled event").slice(0, 200);
  return {
    title,
    description: ogDescription?.slice(0, 800) ?? null,
    url: canonical,
    location: null,
    startDate: new Date(NaN), // signals "needs dates"
    endDate: null,
    type: "in-person",
    sourcePlatform: hostPlatform(canonical),
    sourceUrl: canonical,
    externalId: canonical,
    sourcePayload: { needsDates: true, og: { title: ogTitle, description: ogDescription } },
  };
}

export function eventNeedsDates(resolved: ResolvedEvent) {
  return Number.isNaN(resolved.startDate.getTime());
}
