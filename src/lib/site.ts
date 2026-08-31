/**
 * Canonical site identity for metadata, sitemap, and absolute URLs.
 * Prefer NEXT_PUBLIC_SITE_URL in Vercel once the custom domain is live.
 */
export const SITE_NAME = "sit with design";
export const SITE_TAGLINE = "curated design";
export const SITE_DESCRIPTION =
  "A calm curation of writing, visuals, and design events — quality over quantity.";
export const SITE_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const SITE_DOMAIN = "sitwithdesign.online";

function resolveSiteOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) {
    return (vercel.startsWith("http") ? vercel : `https://${vercel}`).replace(
      /\/$/,
      ""
    );
  }

  return `https://${SITE_DOMAIN}`;
}

export const SITE_ORIGIN = resolveSiteOrigin();
/** @deprecated Prefer SITE_ORIGIN — kept as alias for clarity in metadata. */
export const SITE_URL = SITE_ORIGIN;

export const SITE_CREATOR_X = "robbothecreat0r";
/** BCP 47 tag for Intl / HTML lang (hyphen). */
export const SITE_LOCALE = "en-GB";
/** Open Graph locale (underscore form). */
export const SITE_OG_LOCALE = "en_GB";

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}
