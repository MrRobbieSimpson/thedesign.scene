import { fetchOpenGraph } from "@/lib/ingest/og";
import { fetchXOEmbed, parseXStatusUrl } from "@/lib/ingest/oembed-x";
import type { ResolvedImport, SourcePlatform } from "@/lib/ingest/types";

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function platformFromHost(host: string): SourcePlatform {
  if (host === "layers.to" || host.endsWith(".layers.to")) return "layers";
  if (host === "handheld.design" || host.endsWith(".handheld.design")) {
    return "handheld";
  }
  if (host === "dezeen.com" || host.endsWith(".dezeen.com")) return "dezeen";
  if (host === "x.com" || host === "twitter.com") return "x";
  return "web";
}

function suggestType(platform: SourcePlatform, host: string): ResolvedImport["type"] {
  if (platform === "x") return "post";
  if (platform === "layers") return "visual";
  if (platform === "handheld" || platform === "dezeen") return "news";
  if (host.includes("itsnicethat") || host.includes("fastcompany")) return "news";
  return "visual";
}

function layersExternalId(url: string) {
  try {
    const { pathname } = new URL(url);
    return pathname.replace(/\/+$/, "") || pathname;
  } catch {
    return url;
  }
}

export async function resolveImportUrl(inputUrl: string): Promise<ResolvedImport> {
  const trimmed = inputUrl.trim();
  if (!trimmed) throw new Error("URL is required");

  const x = parseXStatusUrl(trimmed);
  if (x) {
    const embed = await fetchXOEmbed(x.canonical);
    const title =
      embed.text?.split("\n").find((line) => line.trim().length > 0)?.slice(0, 120) ??
      `Post by @${x.handle}`;

    return {
      type: "post",
      title,
      excerpt: embed.text,
      image: null,
      url: embed.url,
      sourcePlatform: "x",
      sourceUrl: embed.url,
      externalId: x.statusId,
      authorHandle: embed.authorHandle,
      authorName: embed.authorName,
      sourcePayload: { html: embed.html },
    };
  }

  const og = await fetchOpenGraph(trimmed);
  const canonical = og.url ?? trimmed;
  const host = hostOf(canonical);
  const platform = platformFromHost(host);
  const type = suggestType(platform, host);

  return {
    type,
    title: og.title?.slice(0, 180) || host || "Untitled",
    excerpt: og.description?.slice(0, 500) ?? null,
    image: og.image,
    url: canonical,
    sourcePlatform: platform,
    sourceUrl: canonical,
    externalId:
      platform === "layers"
        ? layersExternalId(canonical)
        : canonical,
    authorHandle: null,
    authorName: og.siteName,
    sourcePayload: { og },
  };
}
