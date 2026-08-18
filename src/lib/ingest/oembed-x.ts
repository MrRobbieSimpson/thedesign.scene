export type XOEmbed = {
  url: string;
  authorName: string | null;
  authorHandle: string | null;
  html: string | null;
  text: string | null;
};

function stripTags(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseXStatusUrl(input: string) {
  try {
    const url = new URL(input);
    if (
      !["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(
        url.hostname
      )
    ) {
      return null;
    }

    const match = url.pathname.match(/\/([^/]+)\/status\/(\d+)/);
    if (!match) return null;

    return {
      handle: match[1],
      statusId: match[2],
      canonical: `https://x.com/${match[1]}/status/${match[2]}`,
    };
  } catch {
    return null;
  }
}

export async function fetchXOEmbed(statusUrl: string): Promise<XOEmbed> {
  const parsed = parseXStatusUrl(statusUrl);
  if (!parsed) {
    throw new Error("Not a valid X / Twitter status URL");
  }

  const endpoint = new URL("https://publish.x.com/oembed");
  endpoint.searchParams.set("url", parsed.canonical);
  endpoint.searchParams.set("omit_script", "true");
  endpoint.searchParams.set("dnt", "true");

  const response = await fetch(endpoint.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`X oEmbed failed (${response.status})`);
  }

  const data = (await response.json()) as {
    url?: string;
    author_name?: string;
    author_url?: string;
    html?: string;
  };

  const text = data.html ? stripTags(data.html) : null;
  const resolvedUrl = data.url ?? parsed.canonical;
  const resolved = parseXStatusUrl(resolvedUrl);

  let authorHandle = resolved?.handle ?? parsed.handle;
  if (data.author_url) {
    try {
      const authorPath = new URL(data.author_url).pathname.replace(/^\//, "");
      if (authorPath) authorHandle = authorPath.split("/")[0];
    } catch {
      // keep parsed handle
    }
  }

  return {
    url: resolvedUrl,
    authorName: data.author_name ?? null,
    authorHandle,
    html: data.html ?? null,
    text,
  };
}
