import { and, eq } from "drizzle-orm";

import { content, events, type ContentType } from "@/db/schema";
import { db, isDatabaseConfigured } from "@/db";
import {
  demoEvents,
  demoMakers,
  filterDemoContent,
  type ContentWithMaker,
} from "@/lib/demo-data";

export async function getPublishedContent(
  type: ContentType | "all" = "all"
): Promise<ContentWithMaker[]> {
  if (!isDatabaseConfigured() || !db) {
    return filterDemoContent(type);
  }

  const conditions = [eq(content.status, "published")];
  if (type !== "all") {
    conditions.push(eq(content.type, type));
  }

  const rows = await db.query.content.findMany({
    where: and(...conditions),
    with: { maker: true },
    orderBy: (fields, { desc: d }) => [
      d(fields.publishedAt),
      d(fields.createdAt),
    ],
  });

  return rows;
}

export async function getAllContent(): Promise<ContentWithMaker[]> {
  if (!isDatabaseConfigured() || !db) {
    return filterDemoContent("all", { includeDrafts: true });
  }

  return db.query.content.findMany({
    with: { maker: true },
    orderBy: (fields, { desc: d }) => [d(fields.createdAt)],
  });
}

export async function getContentById(
  id: string
): Promise<ContentWithMaker | null> {
  if (!isDatabaseConfigured() || !db) {
    return filterDemoContent("all", { includeDrafts: true }).find(
      (item) => item.id === id
    ) ?? null;
  }

  const row = await db.query.content.findFirst({
    where: eq(content.id, id),
    with: { maker: true },
  });

  return row ?? null;
}

export async function getPublishedEvents() {
  if (!isDatabaseConfigured() || !db) {
    return demoEvents
      .filter((event) => event.status === "published")
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  return db.query.events.findMany({
    where: eq(events.status, "published"),
    orderBy: (fields, { asc }) => [asc(fields.startDate)],
  });
}

export async function getMakers() {
  if (!isDatabaseConfigured() || !db) {
    return demoMakers;
  }

  return db.query.makers.findMany({
    orderBy: (fields, { asc }) => [asc(fields.name)],
  });
}
