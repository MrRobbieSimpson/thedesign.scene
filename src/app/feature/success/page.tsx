import Link from "next/link";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

import { Button } from "@/components/ui/button";
import { db, isDatabaseConfigured } from "@/db";
import { content } from "@/db/schema";
import { markArticleFeaturePaidFromCheckout } from "@/lib/article-feature";
import { buildPageMetadata } from "@/lib/seo";
import { getStripe } from "@/lib/stripe";

export const metadata = buildPageMetadata({
  title: "Feature requested",
  path: "/feature/success",
  description: "Your feature payment was received and is awaiting review.",
  noIndex: true,
});

export default async function FeatureSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  let title: string | null = null;
  let confirmed = false;

  if (sessionId && isDatabaseConfigured() && db) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const contentId =
          session.metadata?.contentId || session.client_reference_id || null;

        if (
          contentId &&
          session.payment_status === "paid" &&
          session.metadata?.kind === "article_feature"
        ) {
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null;

          const marked = await markArticleFeaturePaidFromCheckout({
            contentId,
            checkoutSessionId: session.id,
            paymentIntentId,
            amountCents: session.amount_total,
          });

          if (marked.ok && !marked.already) {
            revalidatePath("/admin");
            revalidatePath("/");
            revalidateTag("content");
          }

          const row = await db.query.content.findFirst({
            where: eq(content.id, contentId),
            columns: {
              title: true,
              featureBoostStatus: true,
              featurePaidAt: true,
            },
          });
          if (
            row &&
            (row.featurePaidAt || row.featureBoostStatus === "pending_review")
          ) {
            confirmed = true;
            title = row.title;
          }
        }
      } catch (error) {
        console.error("[feature success]", error);
      }
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[45rem] px-5 py-10 sm:px-6 sm:py-20">
      <section className="space-y-4">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Submitted
        </p>
        <h1 className="font-heading text-[1.85rem] tracking-tight sm:text-4xl">
          {confirmed
            ? "Thanks — we’ll review your feature."
            : "Payment received."}
        </h1>
        <p className="max-w-prose text-base leading-relaxed text-muted-foreground sm:text-lg">
          {confirmed && title ? (
            <>
              <span className="text-foreground">{title}</span> is queued as a
              paid feature request.
            </>
          ) : (
            <>If you just completed checkout, your request is in the queue.</>
          )}
        </p>
        <Button
          className="mt-2 h-9 border-0 bg-foreground px-4 text-background hover:bg-foreground/90 hover:text-background"
          render={<Link href="/" />}
          nativeButton={false}
        >
          Back to writing
        </Button>
      </section>
    </div>
  );
}
