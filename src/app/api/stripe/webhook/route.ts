import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { markArticleFeaturePaidFromCheckout } from "@/lib/article-feature";
import { markEventPaidFromCheckout } from "@/lib/event-post";
import { markJobPaidFromCheckout } from "@/lib/job-post";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function notifyAdmin(subject: string, body: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.DIGEST_FROM_EMAIL?.trim();
  const adminTo =
    process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
    process.env.ADMIN_EMAILS?.split(",")[0]?.trim();

  if (!apiKey || !from || !adminTo) return;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({ from, to: adminTo, subject, text: body });
  } catch (error) {
    console.error("[stripe webhook] admin notify failed", error);
  }
}

function paymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;
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
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const kind = session.metadata?.kind ?? null;
  const pi = paymentIntentId(session);
  const email =
    session.customer_details?.email ?? session.customer_email ?? null;

  if (kind === "job_post" || (!kind && session.metadata?.jobId)) {
    const jobId =
      session.metadata?.jobId || session.client_reference_id || null;
    if (!jobId) return NextResponse.json({ received: true, ignored: true });

    const result = await markJobPaidFromCheckout({
      jobId,
      checkoutSessionId: session.id,
      paymentIntentId: pi,
      amountCents: session.amount_total,
      currency: session.currency,
      customerEmail: email,
    });

    if (result.ok && !result.already) {
      revalidatePath("/admin");
      revalidatePath("/jobs");
      revalidateTag("jobs");
      await notifyAdmin(
        "Paid job pending review",
        `A company paid $70 for a job listing.\n\nJob id: ${jobId}\n`
      );
    }
    return NextResponse.json({ received: true });
  }

  if (kind === "event_post") {
    const eventId =
      session.metadata?.eventId || session.client_reference_id || null;
    if (!eventId) return NextResponse.json({ received: true, ignored: true });

    const result = await markEventPaidFromCheckout({
      eventId,
      checkoutSessionId: session.id,
      paymentIntentId: pi,
      amountCents: session.amount_total,
      currency: session.currency,
      customerEmail: email,
    });

    if (result.ok && !result.already) {
      revalidatePath("/admin");
      revalidatePath("/events");
      revalidateTag("events");
      await notifyAdmin(
        "Paid event pending review",
        `An organiser paid $70 for an event listing.\n\nEvent id: ${eventId}\n`
      );
    }
    return NextResponse.json({ received: true });
  }

  if (kind === "article_feature") {
    const contentId =
      session.metadata?.contentId || session.client_reference_id || null;
    if (!contentId) return NextResponse.json({ received: true, ignored: true });

    const result = await markArticleFeaturePaidFromCheckout({
      contentId,
      checkoutSessionId: session.id,
      paymentIntentId: pi,
      amountCents: session.amount_total,
    });

    if (result.ok && !result.already) {
      revalidatePath("/admin");
      revalidatePath("/");
      revalidateTag("content");
      await notifyAdmin(
        "Paid article feature pending review",
        `An author paid $10 to feature a piece.\n\nContent id: ${contentId}\n`
      );
    }
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true, ignored: true });
}
