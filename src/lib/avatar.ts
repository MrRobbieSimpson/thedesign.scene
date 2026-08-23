/**
 * Ask Clerk (and similar CDNs) for a sharper source, then let Next/Image
 * serve at the display size. `displayPx` is CSS pixels; we request 2×.
 */
export function avatarSrc(
  url: string | null | undefined,
  displayPx: number
): string | null {
  if (!url?.trim()) return null;

  const requestPx = Math.min(Math.max(Math.round(displayPx * 2), 64), 512);

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (
      host.includes("clerk.com") ||
      host.includes("clerk.dev") ||
      host.includes("img.clerk")
    ) {
      parsed.searchParams.set("width", String(requestPx));
      parsed.searchParams.set("height", String(requestPx));
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    }
  } catch {
    // fall through
  }

  return url;
}
