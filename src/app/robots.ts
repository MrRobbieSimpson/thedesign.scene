import type { MetadataRoute } from "next";

import { SITE_ORIGIN } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/drafts",
          "/me",
          "/saves",
          "/scenes",
          "/settings",
          "/sign-in",
          "/sign-up",
        ],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
