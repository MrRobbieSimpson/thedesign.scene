import { Suspense } from "react";

import { FeedFilters } from "@/components/content/feed-filters";
import { FeedGrid } from "@/components/content/feed-grid";
import { isDatabaseConfigured } from "@/db";
import { CONTENT_TYPES, type ContentType } from "@/db/schema";
import { getPublishedContent } from "@/lib/queries";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams;
  const rawType = params.type ?? "all";
  const type = (
    rawType === "all" || (CONTENT_TYPES as readonly string[]).includes(rawType)
      ? rawType
      : "all"
  ) as ContentType | "all";

  const items = await getPublishedContent(type);
  const usingDemo = !isDatabaseConfigured();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <section className="mb-12 max-w-2xl space-y-4">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Curated feed
        </p>
        <h1 className="font-heading text-4xl tracking-tight text-balance sm:text-5xl">
          Design worth sitting with.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Editorial writing first — plus visuals, builds, news, and posts.
          Quality over quantity.
        </p>
      </section>

      {usingDemo ? (
        <div className="mb-8 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Running with demo data. Add a{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            DATABASE_URL
          </code>{" "}
          in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code>{" "}
          to connect Postgres (Neon or Supabase).
        </div>
      ) : null}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Suspense
          fallback={
            <div className="h-10 w-72 animate-pulse rounded-full bg-muted" />
          }
        >
          <FeedFilters />
        </Suspense>
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <FeedGrid items={items} />
    </div>
  );
}
