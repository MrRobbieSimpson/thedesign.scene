import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Resend } from "resend";

import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { buildWeeklyDigest } from "@/lib/digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireCronAuth(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const preview = url.searchParams.get("preview") === "1";
  const to = url.searchParams.get("to")?.trim().toLowerCase() || null;
  const locationParam = url.searchParams.get("location")?.trim() || null;

  const cronOk = requireCronAuth(request);
  const adminOk = await isAdmin().catch(() => false);
  if (!cronOk && !adminOk) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json(
      { ok: false, message: "Database not configured" },
      { status: 500 }
    );
  }

  // Preview / one-off: optional location override.
  if (preview || to) {
    const digest = await buildWeeklyDigest({ location: locationParam });
    if (digest.skipped) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: digest.skipped,
        picks: digest.picks,
        writing: digest.writing,
        events: digest.events,
      });
    }

    if (preview && !to) {
      return new NextResponse(digest.html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.DIGEST_FROM_EMAIL;
    if (!apiKey || !from) {
      return NextResponse.json(
        {
          ok: false,
          message: "Set RESEND_API_KEY and DIGEST_FROM_EMAIL to send digests.",
        },
        { status: 500 }
      );
    }

    if (to) {
      try {
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from,
          to,
          subject: `[Test] ${digest.subject}`,
          html: digest.html,
        });
        return NextResponse.json({
          ok: true,
          test: true,
          to,
          location: digest.locationLabel ?? null,
          picks: digest.picks,
          writing: digest.writing,
          events: digest.events,
        });
      } catch (error) {
        return NextResponse.json(
          {
            ok: false,
            message: error instanceof Error ? error.message : "Send failed",
          },
          { status: 500 }
        );
      }
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DIGEST_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json(
      {
        ok: false,
        message: "Set RESEND_API_KEY and DIGEST_FROM_EMAIL to send digests.",
      },
      { status: 500 }
    );
  }

  const subscribers = await db.query.newsletterSubscribers.findMany({
    where: eq(newsletterSubscribers.status, "active"),
    with: { profile: true },
  });

  if (subscribers.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "No subscribers.",
    });
  }

  const resend = new Resend(apiKey);
  const cache = new Map<string, Awaited<ReturnType<typeof buildWeeklyDigest>>>();
  let sent = 0;
  const errors: string[] = [];

  for (const subscriber of subscribers) {
    const location = subscriber.profile?.location ?? null;
    const cacheKey = location?.trim().toLowerCase() || "__global__";

    let digest = cache.get(cacheKey);
    if (!digest) {
      digest = await buildWeeklyDigest({ location });
      cache.set(cacheKey, digest);
    }

    if (digest.skipped || !digest.html) {
      continue;
    }

    try {
      await resend.emails.send({
        from,
        to: subscriber.email,
        subject: digest.subject,
        html: digest.html,
      });
      sent += 1;
    } catch (error) {
      errors.push(
        `${subscriber.email}: ${
          error instanceof Error ? error.message : "send failed"
        }`
      );
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    subscribers: subscribers.length,
    locationVariants: cache.size,
    errors: errors.slice(0, 5),
  });
}
