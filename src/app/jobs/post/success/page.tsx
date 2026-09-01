import Link from "next/link";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

import { Button } from "@/components/ui/button";
import { db, isDatabaseConfigured } from "@/db";
import { jobs } from "@/db/schema";
import { markJobPaidFromCheckout } from "@/lib/job-post";
import { buildPageMetadata } from "@/lib/seo";
import { getStripe } from "@/lib/stripe";

export const metadata = buildPageMetadata({
  title: "Listing submitted",
  path: "/jobs/post/success",
  description: "Your job listing payment was received and is awaiting review.",
});

export default async function JobPostSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  let confirmed = false;
  let company: string | null = null;
  let title: string | null = null;

  if (sessionId && isDatabaseConfigured() && db) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const jobId =
          session.metadata?.jobId || session.client_reference_id || null;

        if (
          jobId &&
          session.payment_status === "paid" &&
          (session.metadata?.kind === "job_post" || !session.metadata?.kind)
        ) {
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null;

          const marked = await markJobPaidFromCheckout({
            jobId,
            checkoutSessionId: session.id,
            paymentIntentId,
            amountCents: session.amount_total,
            currency: session.currency,
            customerEmail:
              session.customer_details?.email ?? session.customer_email,
          });

          if (marked.ok && !marked.already) {
            revalidatePath("/admin");
            revalidatePath("/jobs");
            revalidateTag("jobs");
          }

          const job = await db.query.jobs.findFirst({
            where: eq(jobs.id, jobId),
            columns: { title: true, company: true, status: true, paidAt: true },
          });

          if (job && (job.paidAt || job.status === "pending_review")) {
            confirmed = true;
            title = job.title;
            company = job.company;
          }
        }
      } catch (error) {
        console.error("[job post success] session retrieve failed", error);
      }
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[45rem] px-5 py-10 sm:px-6 sm:py-20">
      <section className="space-y-4">
        <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Submitted
        </p>
        <h1 className="font-heading text-[1.85rem] tracking-tight text-balance sm:text-4xl">
          {confirmed
            ? "Thanks — we’ll review your listing."
            : "Payment received."}
        </h1>
        <p className="max-w-prose text-base leading-relaxed text-muted-foreground sm:text-lg">
          {confirmed && title && company ? (
            <>
              <span className="text-foreground">{title}</span> at{" "}
              <span className="text-foreground">{company}</span> is in the
              review queue. We’ll publish it when it meets the bar — usually
              within a few days.
            </>
          ) : (
            <>
              If you just completed checkout, your listing is in the queue.
              You’ll hear from us if anything needs a tweak.
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-3 pt-4">
          <Button
            className="h-9 border-0 bg-foreground px-4 text-background hover:bg-foreground/90 hover:text-background"
            render={<Link href="/jobs" />}
            nativeButton={false}
          >
            View openings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            render={<Link href="/" />}
            nativeButton={false}
          >
            Back to the feed
          </Button>
        </div>
      </section>
    </div>
  );
}
