import { classifyXWriting } from "@/lib/ingest/designer-writers";
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
  if (host === "x.com" || host === "twitter.com") return "x";
  if (host === "layers.to" || host.endsWith(".layers.to")) return "layers";
  if (host === "handheld.design" || host.endsWith(".handheld.design")) {
    return "handheld";
  }
  if (host === "dezeen.com" || host.endsWith(".dezeen.com")) return "dezeen";
  if (host === "dribbble.com" || host.endsWith(".dribbble.com")) {
    return "dribbble";
  }
  if (host === "behance.net" || host.endsWith(".behance.net")) return "behance";
  if (host === "awwwards.com" || host.endsWith(".awwwards.com")) {
    return "awwwards";
  }
  if (host === "siteinspire.com" || host.endsWith(".siteinspire.com")) {
    return "siteinspire";
  }
  if (
    host === "spottedinprod.com" ||
    host.endsWith(".spottedinprod.com")
  ) {
    return "spottedinprod";
  }
  if (host === "medium.com" || host.endsWith(".medium.com")) return "medium";
  if (
    host === "smashingmagazine.com" ||
    host.endsWith(".smashingmagazine.com")
  ) {
    return "smashing";
  }
  return "web";
}

function suggestType(
  platform: SourcePlatform,
  host: string,
  pathname: string
): ResolvedImport["type"] {
  // X typing is decided after oEmbed (length → thought vs post).
  if (platform === "x") return "post";

  // Portfolio / shot / inspiration galleries → visual
  if (
    platform === "layers" ||
    platform === "behance" ||
    platform === "siteinspire" ||
    platform === "spottedinprod"
  ) {
    return "visual";
  }

  if (platform === "dribbble") {
    if (pathname.startsWith("/shots") || pathname.includes("/shots/")) {
      return "visual";
    }
    return "article";
  }

  if (platform === "awwwards") {
    if (pathname.includes("/sites/") || pathname.includes("/inspiration")) {
      return "visual";
    }
    return "article";
  }

  // Writing pubs & designer essays → article (not news)
  if (
    platform === "handheld" ||
    platform === "medium" ||
    platform === "smashing" ||
    host.includes("itsnicethat") ||
    host.includes("nngroup") ||
    host.includes("bradfrost") ||
    host.includes("joshwcomeau") ||
    host.includes("sarasoueidan") ||
    host.includes("adactio") ||
    host.includes("maggieappleton") ||
    host.includes("matthewstrom") ||
    host.includes("robinrendle") ||
    host.includes("vanschneider") ||
    host.includes("css-tricks") ||
    (host.includes("figma.com") && pathname.includes("/blog")) ||
    pathname.includes("/blog") ||
    pathname.includes("/articles") ||
    pathname.includes("/essay")
  ) {
    return "article";
  }

  if (
    platform === "dezeen" ||
    host.includes("fastcompany") ||
    host.includes("designweek") ||
    host.includes("designboom") ||
    host.includes("creativebloq")
  ) {
    return "news";
  }

  // Default for unknown design URLs: treat as visual inspiration
  return "visual";
}

function pathExternalId(url: string) {
  try {
    const { pathname, search } = new URL(url);
    return `${pathname.replace(/\/+$/, "") || "/"}${search}`;
  } catch {
    return url;
  }
}

export async function resolveImportUrl(
  inputUrl: string
): Promise<ResolvedImport> {
  const trimmed = inputUrl.trim();
  if (!trimmed) throw new Error("URL is required");

  const x = parseXStatusUrl(trimmed);
  if (x) {
    const embed = await fetchXOEmbed(x.canonical);
    const title =
      embed.text
        ?.split("\n")
        .find((line) => line.trim().length > 0)
        ?.slice(0, 120) ?? `Post by @${x.handle}`;

    return {
      type: classifyXWriting(embed.text),
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
  let pathname = "/";
  try {
    pathname = new URL(canonical).pathname;
  } catch {
    // ignore
  }
  const platform = platformFromHost(host);
  const type = suggestType(platform, host, pathname);

  return {
    type,
    title: og.title?.slice(0, 180) || host || "Untitled",
    excerpt: og.description?.slice(0, 500) ?? null,
    image: og.image,
    url: canonical,
    sourcePlatform: platform,
    sourceUrl: canonical,
    externalId: pathExternalId(canonical),
    authorHandle: null,
    authorName: og.siteName,
    sourcePayload: { og },
  };
}
