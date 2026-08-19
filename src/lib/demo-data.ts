import type {
  Content,
  ContentType,
  Event,
  Maker,
  Profile,
} from "@/db/schema";

/** Empty fallbacks — the live site uses Neon only. */
export const demoMakers: Maker[] = [];

export type ContentWithMaker = Content & {
  maker: Maker | null;
  authorProfile?: Profile | null;
};

export const demoContent: ContentWithMaker[] = [];

export const demoEvents: Event[] = [];

export function filterDemoContent(
  _type?: ContentType | "all",
  _options?: { includeDrafts?: boolean }
): ContentWithMaker[] {
  return [];
}
