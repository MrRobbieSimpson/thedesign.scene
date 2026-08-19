import { and, desc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Resend } from "resend";

import { db } from "@/db";
import { content, events, newsletterSubscribers } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireCronAuth(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // allow local / unset during setup
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!requireCronAuth(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json(
      { ok: false, message: "Database not configured" },
      { status: 500 }
    );
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

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [picks, freshWriting, upcoming] = await Promise.all([
    db.query.content.findMany({
      where: and(eq(content.status, "published"), eq(content.featured, true)),
      orderBy: [desc(content.publishedAt)],
      limit: 3,
    }),
    db.query.content.findMany({
      where: and(
        eq(content.status, "published"),
        gte(content.publishedAt, weekAgo)
      ),
      orderBy: [desc(content.publishedAt)],
      limit: 5,
    }),
    db.query.events.findMany({
      where: and(
        eq(events.status, "published"),
        gte(events.startDate, new Date())
      ),
      orderBy: (fields, { asc }) => [asc(fields.startDate)],
      limit: 3,
    }),
  ]);

  const writing = freshWriting.filter(
    (item) => item.type === "article" || item.type === "thought"
  );

  if (picks.length + writing.length + upcoming.length < 2) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "Not enough curated items this week.",
    });
  }

  const subscribers = await db.query.newsletterSubscribers.findMany({
    where: eq(newsletterSubscribers.status, "active"),
  });

  if (subscribers.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "No subscribers.",
    });
  }

  const site = "https://thedesign-scene.vercel.app";
  const lines: string[] = [
    "<h1 style=\"font-family:Georgia,serif;font-weight:500\">Design worth sitting with</h1>",
    "<p style=\"color:#666\">A small weekly selection from thedesign.scene.</p>",
  ];

  if (picks.length) {
    lines.push("<h2>Editor’s picks</h2><ul>");
    for (const item of picks) {
      const href = item.slug
        ? `${site}/article/${item.slug}`
        : `${site}/content/${item.id}`;
      lines.push(
        `<li><a href="${href}">${escapeHtml(item.title)}</a>${
          item.editorNote
            ? `<br/><em style="color:#666">${escapeHtml(item.editorNote)}</em>`
            : ""
        }</li>`
      );
    }
    lines.push("</ul>");
  }

  if (writing.length) {
    lines.push("<h2>New writing</h2><ul>");
    for (const item of writing.slice(0, 4)) {
      const href = item.slug
        ? `${site}/article/${item.slug}`
        : `${site}/content/${item.id}`;
      lines.push(`<li><a href="${href}">${escapeHtml(item.title)}</a></li>`);
    }
    lines.push("</ul>");
  }

  if (upcoming.length) {
    lines.push("<h2>Upcoming events</h2><ul>");
    for (const event of upcoming) {
      lines.push(
        `<li>${escapeHtml(event.title)}${
          event.url ? ` — <a href="${event.url}">Details</a>` : ""
        }</li>`
      );
    }
    lines.push("</ul>");
  }

  lines.push(
    `<p style="color:#999;font-size:12px;margin-top:32px"><a href="${site}/subscribe">Manage subscription</a> · <a href="${site}">Open the scene</a></p>`
  );

  const html = lines.join("\n");
  const resend = new Resend(apiKey);
  let sent = 0;
  const errors: string[] = [];

  for (const subscriber of subscribers) {
    try {
      await resend.emails.send({
        from,
        to: subscriber.email,
        subject: "This week in thedesign.scene",
        html,
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
    errors: errors.slice(0, 5),
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
