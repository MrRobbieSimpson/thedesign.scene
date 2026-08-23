/**
 * Build the best available avatar URL.
 *
 * Clerk’s X OAuth images are often locked at 48×48. When we know an X handle,
 * prefer Unavatar (typically 400×400). Fall back to Clerk / stored URL.
 */
export function avatarSrc(
  url: string | null | undefined,
  displayPx: number,
  options?: { xHandle?: string | null }
): string | null {
  const handle = options?.xHandle?.replace(/^@/, "").trim();
  if (handle) {
    // High-res social avatar; size hint for CDNs that honour it.
    const size = Math.min(Math.max(Math.round(displayPx * 3), 128), 512);
    return `https://unavatar.io/x/${encodeURIComponent(handle)}?size=${size}`;
  }

  if (!url?.trim()) return null;

  // Unwrap Clerk proxy payload to the underlying source when possible.
  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase().includes("img.clerk")) {
      const token = parsed.pathname.split("/").filter(Boolean).pop();
      if (token) {
        try {
          const padded =
            token.replace(/-/g, "+").replace(/_/g, "/") +
            "===".slice((token.length + 3) % 4);
          const json = JSON.parse(atob(padded)) as { src?: string };
          if (json.src) return json.src;
        } catch {
          // keep proxy url
        }
      }
    }
  } catch {
    // fall through
  }

  return url;
}
