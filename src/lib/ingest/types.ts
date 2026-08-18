import type { ContentType } from "@/db/schema";

export type SourcePlatform =
  | "x"
  | "layers"
  | "handheld"
  | "dezeen"
  | "rss"
  | "web";

export type ResolvedImport = {
  type: ContentType;
  title: string;
  excerpt: string | null;
  image: string | null;
  url: string;
  sourcePlatform: SourcePlatform;
  sourceUrl: string;
  externalId: string | null;
  authorHandle: string | null;
  authorName: string | null;
  sourcePayload?: Record<string, unknown>;
};

export type RssCandidate = {
  title: string;
  url: string;
  excerpt: string | null;
  image: string | null;
  externalId: string;
  publishedAt: Date | null;
  authorName: string | null;
};
