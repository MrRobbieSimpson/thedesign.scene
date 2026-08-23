import type { MetadataRoute } from "next";
import { and, eq, isNotNull } from "drizzle-orm";

import { db, isDatabaseConfigured } from "@/db";
import { content, profiles } from "@/db/schema";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: absoluteUrl("/events"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/subscribe"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  if (!isDatabaseConfigured() || !db) {
    return staticRoutes;
  }

  const [articles, pieces, people] = await Promise.all([
    db.query.content.findMany({
      where: and(
        eq(content.status, "published"),
        eq(content.type, "article"),
        isNotNull(content.slug)
      ),
      columns: { slug: true, updatedAt: true, publishedAt: true },
      limit: 500,
    }),
    db.query.content.findMany({
      where: and(
        eq(content.status, "published"),
        // Non-article published cards live at /content/[id]
      ),
      columns: {
        id: true,
        type: true,
        slug: true,
        updatedAt: true,
        publishedAt: true,
      },
      limit: 500,
    }),
    db.query.profiles.findMany({
      where: isNotNull(profiles.handle),
      columns: { handle: true, updatedAt: true },
      limit: 500,
    }),
  ]);

  const articleEntries: MetadataRoute.Sitemap = articles
    .filter((row) => row.slug)
    .map((row) => ({
      url: absoluteUrl(`/article/${row.slug}`),
      lastModified: row.updatedAt ?? row.publishedAt ?? undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const contentEntries: MetadataRoute.Sitemap = pieces
    .filter((row) => row.type !== "article")
    .map((row) => ({
      url: absoluteUrl(`/content/${row.id}`),
      lastModified: row.updatedAt ?? row.publishedAt ?? undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const profileEntries: MetadataRoute.Sitemap = people
    .filter((row) => row.handle)
    .map((row) => ({
      url: absoluteUrl(`/u/${row.handle}`),
      lastModified: row.updatedAt ?? undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [
    ...staticRoutes,
    ...articleEntries,
    ...contentEntries,
    ...profileEntries,
  ];
}
