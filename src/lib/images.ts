/**
 * Normalize remote image URLs before storing or passing to next/image.
 * Fixes common optimizer failures (e.g. httpster.net//assets/...).
 */
export function normalizeImageUrl(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    url.pathname = url.pathname.replace(/\/{2,}/g, "/");
    return url.toString();
  } catch {
    return trimmed.replace(/(https?:\/\/[^/]+)\/{2,}/g, "$1/");
  }
}
