export type OpenGraphData = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  url: string | null;
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

export async function fetchOpenGraph(url: string): Promise<OpenGraphData> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "sitwithdesign/1.0 (+https://sitwithdesign.online; curated design platform)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL (${response.status})`);
  }

  const html = await response.text();

  return {
    title:
      metaContent(html, ["og:title", "twitter:title"]) ?? titleTag(html),
    description: metaContent(html, [
      "og:description",
      "twitter:description",
      "description",
    ]),
    image: metaContent(html, ["og:image", "twitter:image", "twitter:image:src"]),
    siteName: metaContent(html, ["og:site_name"]),
    url: metaContent(html, ["og:url"]) ?? response.url ?? url,
  };
}
