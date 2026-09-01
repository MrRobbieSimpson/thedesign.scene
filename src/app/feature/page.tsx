import { Suspense } from "react";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { FeatureBoostButton } from "@/components/content/feature-boost-button";
import { db, isDatabaseConfigured } from "@/db";
import { content } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/auth";
import { ARTICLE_FEATURE_AMOUNT_CENTS, isStripeConfigured } from "@/lib/stripe";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Feature writing",
  path: "/feature",
  description:
    "Boost your published writing to the editor’s picks — $10, reviewed before it goes live.",
  noIndex: true,
});

const priceLabel = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(ARTICLE_FEATURE_AMOUNT_CENTS / 100);

export default async function FeaturePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; canceled?: string }>;
}) {
  const params = await searchParams;
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/sign-in");

  const pieces =
    isDatabaseConfigured() && db
      ? await db.query.content.findMany({
          where: and(
            eq(content.authorProfileId, profile.id),
            eq(content.status, "published")
          ),
          orderBy: [desc(content.publishedAt)],
          limit: 40,
          columns: {
            id: true,
            title: true,
            slug: true,
            featured: true,
            featureBoostStatus: true,
            type: true,
          },
        })
      : [];

  const boostable = pieces.filter(
    (item) =>
      (item.type === "article" || item.type === "thought") &&
      !item.featured &&
      item.featureBoostStatus === "none"
  );

  const focusId = params.id?.trim() || null;
  const focus = focusId
    ? boostable.find((item) => item.id === focusId) ?? null
    : null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[45rem] px-5 py-10 sm:px-6 sm:py-20">
      <section className="mb-8 space-y-4">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Feature writing
        </p>
        <h1 className="font-heading text-[1.85rem] tracking-tight text-balance sm:text-4xl">
          Boost a piece to the editor’s picks.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          {priceLabel} for one published article you wrote. We review before it
          goes live as a featured pick.
        </p>
        <p className="text-sm text-muted-foreground/80">
          <Link href="/" className="underline underline-offset-4">
            Back to writing
          </Link>
        </p>
      </section>

      {params.canceled === "1" ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Checkout canceled — nothing was charged.
        </p>
      ) : null}

      {!isStripeConfigured() ? (
        <p className="text-sm text-muted-foreground">
          Featuring is temporarily unavailable.
        </p>
      ) : focus ? (
        <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
          <p className="font-medium">{focus.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ready to feature this piece?
          </p>
          <div className="mt-4">
            <Suspense fallback={null}>
              <FeatureBoostButton contentId={focus.id} label={`Pay ${priceLabel} & feature`} />
            </Suspense>
          </div>
        </div>
      ) : boostable.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 px-5 py-10 text-sm leading-relaxed text-muted-foreground">
          <p>
            No boostable pieces yet. Publish an article from{" "}
            <span className="text-foreground">Start writing</span>, then come
            back here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70">
          {boostable.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.type}</p>
              </div>
              <FeatureBoostButton
                contentId={item.id}
                label={`Feature — ${priceLabel}`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
