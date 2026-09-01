import {
  ARTICLE_FEATURE_AMOUNT_CENTS,
  ARTICLE_FEATURE_CURRENCY,
  ARTICLE_FEATURE_LABEL,
  EVENT_POST_AMOUNT_CENTS,
  EVENT_POST_CURRENCY,
  EVENT_POST_LABEL,
  JOB_POST_AMOUNT_CENTS,
  JOB_POST_CURRENCY,
  JOB_POST_LABEL,
  getStripe,
  isStripeConfigured,
} from "@/lib/stripe";
import { absoluteUrl } from "@/lib/site";

export type PaidCheckoutKind = "job_post" | "event_post" | "article_feature";

const KIND_CONFIG: Record<
  PaidCheckoutKind,
  {
    amountCents: number;
    currency: string;
    label: string;
    description: string;
    priceEnv: string;
    successPath: string;
    cancelPath: string;
    metaIdKey: "jobId" | "eventId" | "contentId";
  }
> = {
  job_post: {
    amountCents: JOB_POST_AMOUNT_CENTS,
    currency: JOB_POST_CURRENCY,
    label: JOB_POST_LABEL,
    description:
      "One UI / product design opening on sit with design. Reviewed before it goes live.",
    priceEnv: "STRIPE_JOB_PRICE_ID",
    successPath: "/jobs/post/success",
    cancelPath: "/jobs/post",
    metaIdKey: "jobId",
  },
  event_post: {
    amountCents: EVENT_POST_AMOUNT_CENTS,
    currency: EVENT_POST_CURRENCY,
    label: EVENT_POST_LABEL,
    description:
      "One design event listing on sit with design. Reviewed before it goes live.",
    priceEnv: "STRIPE_EVENT_PRICE_ID",
    successPath: "/events/post/success",
    cancelPath: "/events/post",
    metaIdKey: "eventId",
  },
  article_feature: {
    amountCents: ARTICLE_FEATURE_AMOUNT_CENTS,
    currency: ARTICLE_FEATURE_CURRENCY,
    label: ARTICLE_FEATURE_LABEL,
    description:
      "Feature your published writing as an editor’s pick. Reviewed before it goes live.",
    priceEnv: "STRIPE_ARTICLE_FEATURE_PRICE_ID",
    successPath: "/feature/success",
    cancelPath: "/feature",
    metaIdKey: "contentId",
  },
};

export async function createPaidCheckoutSession(options: {
  kind: PaidCheckoutKind;
  entityId: string;
  customerEmail: string;
}) {
  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }

  const config = KIND_CONFIG[options.kind];
  const priceId = process.env[config.priceEnv]?.trim();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: options.customerEmail,
    client_reference_id: options.entityId,
    metadata: {
      kind: options.kind,
      [config.metaIdKey]: options.entityId,
    },
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: config.currency,
              unit_amount: config.amountCents,
              product_data: {
                name: config.label,
                description: config.description,
              },
            },
          },
        ],
    success_url: absoluteUrl(
      `${config.successPath}?session_id={CHECKOUT_SESSION_ID}`
    ),
    cancel_url: absoluteUrl(`${config.cancelPath}?canceled=1`),
  });

  return session;
}

export function normalizeHttpUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isValidContactEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
