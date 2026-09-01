import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { markJobPaidFromCheckout } from "@/lib/job-post";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function notifyAdminPendingJob(jobId: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.DIGEST_FROM_EMAIL?.trim();
  const adminTo =
    process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
    process.env.ADMIN_EMAILS?.split(",")[0]?.trim();

  if (!apiKey || !from || !adminTo) return;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: adminTo,
      subject: "Paid job pending review",
      text: `A company paid $70 for a job listing. Review it in admin.\n\nJob id: ${jobId}\n`,
    });
  } catch (error) {
    console.error("[stripe webhook] admin notify failed", error);
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe webhook] signature failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const jobId =
      session.metadata?.jobId || session.client_reference_id || null;
    const isJobPost =
      session.metadata?.kind === "job_post" ||
      (!session.metadata?.kind && Boolean(jobId));

    if (!jobId || !isJobPost) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const result = await markJobPaidFromCheckout({
      jobId,
      checkoutSessionId: session.id,
      paymentIntentId,
      amountCents: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email ?? session.customer_email,
    });

    if (result.ok && !result.already) {
      revalidatePath("/admin");
      revalidatePath("/jobs");
      revalidateTag("jobs");
      await notifyAdminPendingJob(jobId);
    }
  }

  return NextResponse.json({ received: true });
}
