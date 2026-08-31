import type { Metadata } from "next";

import {
  SITE_CREATOR_X,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_OG_LOCALE,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_TITLE,
  absoluteUrl,
} from "@/lib/site";

export const NO_INDEX: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

type BuildPageMetadataInput = {
  title?: string;
  description?: string | null;
  path?: string;
  image?: string | null;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
};

/**
 * Shared metadata builder — Open Graph, Twitter, canonical.
 */
export function buildPageMetadata({
  title,
  description,
  path = "/",
  image,
  type = "website",
  noIndex = false,
}: BuildPageMetadataInput = {}): Metadata {
  const desc = (description?.trim() || SITE_DESCRIPTION).slice(0, 300);
  const url = absoluteUrl(path);
  const ogImage = image?.trim() || undefined;
  const displayTitle = title ? `${title} · ${SITE_NAME}` : SITE_TITLE;

  const openGraph: Metadata["openGraph"] = {
    type: type === "profile" ? "profile" : type,
    siteName: SITE_NAME,
    locale: SITE_OG_LOCALE,
    url,
    title: displayTitle,
    description: desc,
    ...(ogImage
      ? { images: [{ url: ogImage, alt: title ?? SITE_NAME }] }
      : {}),
  };

  return {
    // Avoid "Site · site" when using the root title template.
    title: title ? title : { absolute: SITE_TITLE },
    description: desc,
    alternates: { canonical: url },
    openGraph,
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: displayTitle,
      description: desc,
      creator: `@${SITE_CREATOR_X}`,
      site: `@${SITE_CREATOR_X}`,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(noIndex ? NO_INDEX : {}),
  };
}

export function rootMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: {
      default: SITE_TITLE,
      template: `%s · ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_ORIGIN }],
    creator: SITE_CREATOR_X,
    publisher: SITE_NAME,
    keywords: [
      "design",
      "design writing",
      "design curation",
      "design events",
      "editorial design",
      "sit with design",
    ],
    referrer: "origin-when-cross-origin",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: { canonical: SITE_ORIGIN },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: SITE_OG_LOCALE,
      url: SITE_ORIGIN,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: "summary",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      creator: `@${SITE_CREATOR_X}`,
      site: `@${SITE_CREATOR_X}`,
    },
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/site.webmanifest",
    category: "design",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["Sit with Design", "sitwithdesign"],
    url: SITE_ORIGIN,
    description: SITE_DESCRIPTION,
    inLanguage: "en-GB",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_ORIGIN,
      sameAs: [`https://x.com/${SITE_CREATOR_X}`],
    },
  };
}
