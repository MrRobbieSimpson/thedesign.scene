import { and, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import { content, events } from "@/db/schema";

const SITE = "https://thedesign-scene.vercel.app";

export type DigestPayload = {
  html: string;
  subject: string;
  picks: number;
  writing: number;
  events: number;
  skipped?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Build this week’s digest HTML from live curated content. */
export async function buildWeeklyDigest(): Promise<DigestPayload> {
  if (!db) {
    return {
      html: "",
      subject: "This week in thedesign.scene",
      picks: 0,
      writing: 0,
      events: 0,
      skipped: "Database not configured",
    };
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
    return {
      html: "",
      subject: "This week in thedesign.scene",
      picks: picks.length,
      writing: writing.length,
      events: upcoming.length,
      skipped: "Not enough curated items this week.",
    };
  }

  const lines: string[] = [
    '<h1 style="font-family:Georgia,serif;font-weight:500;font-size:28px;margin:0 0 8px">Design worth sitting with</h1>',
    '<p style="color:#666;font-size:15px;line-height:1.5;margin:0 0 28px">A small weekly selection from thedesign.scene.</p>',
  ];

  if (picks.length) {
    lines.push(
      '<h2 style="font-family:Georgia,serif;font-size:18px;font-weight:500;margin:0 0 12px">Editor’s picks</h2><ul style="padding-left:18px;margin:0 0 28px">'
    );
    for (const item of picks) {
      const href = item.slug
        ? `${SITE}/article/${item.slug}`
        : `${SITE}/content/${item.id}`;
      lines.push(
        `<li style="margin:0 0 12px;line-height:1.45"><a href="${href}" style="color:#111;text-decoration:underline">${escapeHtml(item.title)}</a>${
          item.editorNote
            ? `<br/><em style="color:#666;font-size:14px">${escapeHtml(item.editorNote)}</em>`
            : ""
        }</li>`
      );
    }
    lines.push("</ul>");
  }

  if (writing.length) {
    lines.push(
      '<h2 style="font-family:Georgia,serif;font-size:18px;font-weight:500;margin:0 0 12px">New writing</h2><ul style="padding-left:18px;margin:0 0 28px">'
    );
    for (const item of writing.slice(0, 4)) {
      const href = item.slug
        ? `${SITE}/article/${item.slug}`
        : `${SITE}/content/${item.id}`;
      lines.push(
        `<li style="margin:0 0 10px;line-height:1.45"><a href="${href}" style="color:#111;text-decoration:underline">${escapeHtml(item.title)}</a></li>`
      );
    }
    lines.push("</ul>");
  }

  if (upcoming.length) {
    lines.push(
      '<h2 style="font-family:Georgia,serif;font-size:18px;font-weight:500;margin:0 0 12px">Upcoming events</h2><ul style="padding-left:18px;margin:0 0 28px">'
    );
    for (const event of upcoming) {
      lines.push(
        `<li style="margin:0 0 10px;line-height:1.45">${escapeHtml(event.title)}${
          event.url
            ? ` — <a href="${event.url}" style="color:#111">Details</a>`
            : ""
        }</li>`
      );
    }
    lines.push("</ul>");
  }

  lines.push(
    `<p style="color:#999;font-size:12px;margin-top:32px"><a href="${SITE}/subscribe" style="color:#999">Manage subscription</a> · <a href="${SITE}" style="color:#999">Open the scene</a></p>`
  );

  return {
    html: `<div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#111">${lines.join("\n")}</div>`,
    subject: "This week in thedesign.scene",
    picks: picks.length,
    writing: writing.length,
    events: upcoming.length,
  };
}
