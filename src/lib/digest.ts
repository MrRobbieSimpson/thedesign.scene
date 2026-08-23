import { and, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import { content, events, type Event } from "@/db/schema";

const SITE = "https://thedesign-scene.vercel.app";

/** Scene ink / paper approximations for email clients. */
const INK = "#1c1914";
const PAPER = "#f7f4ef";
const MUTED = "#7a7468";
const RULE = "rgba(28,25,20,0.12)";

export type DigestPayload = {
  html: string;
  subject: string;
  picks: number;
  writing: number;
  events: number;
  locationLabel?: string | null;
  skipped?: string;
};

export type DigestOptions = {
  /** Profile location string, e.g. "Belfast" — favours nearby events. */
  location?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function locationTokens(location: string) {
  return location
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !["the", "and", "for"].includes(t));
}

function eventMatchesLocation(event: Event, location: string) {
  const hay = `${event.location ?? ""} ${event.title}`.toLowerCase();
  return locationTokens(location).some((token) => hay.includes(token));
}

function isLikelyRemote(event: Event) {
  if (event.type === "remote") return true;
  const loc = (event.location ?? "").toLowerCase();
  return !loc || loc.includes("online") || loc.includes("remote");
}

function pickEventsForLocation(all: Event[], location: string | null | undefined) {
  if (!location?.trim()) {
    return all.slice(0, 3);
  }

  const local = all.filter((event) => eventMatchesLocation(event, location));
  const remote = all.filter(
    (event) => !local.includes(event) && isLikelyRemote(event)
  );
  const rest = all.filter(
    (event) => !local.includes(event) && !remote.includes(event)
  );

  return [...local, ...remote, ...rest].slice(0, 3);
}

function shortLocationLabel(location: string) {
  return location.split(",")[0]?.trim() || location.trim();
}

/** Build this week’s digest HTML — Scene aesthetic, optional local events. */
export async function buildWeeklyDigest(
  options: DigestOptions = {}
): Promise<DigestPayload> {
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
  const location = options.location?.trim() || null;

  const [picks, freshWriting, upcomingAll] = await Promise.all([
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
      limit: 24,
    }),
  ]);

  const writing = freshWriting.filter(
    (item) => item.type === "article" || item.type === "thought"
  );
  const upcoming = pickEventsForLocation(upcomingAll, location);
  const locationLabel = location ? shortLocationLabel(location) : null;

  if (picks.length + writing.length + upcoming.length < 2) {
    return {
      html: "",
      subject: "This week in thedesign.scene",
      picks: picks.length,
      writing: writing.length,
      events: upcoming.length,
      locationLabel,
      skipped: "Not enough curated items this week.",
    };
  }

  const fontStack =
    "'Geist', 'Helvetica Neue', Helvetica, Arial, ui-sans-serif, system-ui, sans-serif";
  const serifStack =
    "'Source Serif 4', 'Source Serif Pro', Georgia, 'Times New Roman', serif";

  const sections: string[] = [];

  sections.push(`
    <p style="margin:0 0 10px;font-family:${fontStack};font-size:11px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED}">
      Editor’s selection
    </p>
    <h1 style="margin:0 0 12px;font-family:${serifStack};font-weight:500;font-size:32px;line-height:1.15;letter-spacing:-0.02em;color:${INK}">
      Design worth sitting with
    </h1>
    <p style="margin:0 0 28px;font-family:${fontStack};font-size:15px;line-height:1.65;color:${MUTED}">
      A small weekly note from thedesign.scene — writing first, then events${
        locationLabel ? ` near ${escapeHtml(locationLabel)}` : ""
      }.
    </p>
  `);

  if (picks.length) {
    sections.push(`
      <p style="margin:0 0 14px;font-family:${fontStack};font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED}">
        Editor’s picks
      </p>
    `);
    for (const item of picks) {
      const href = item.slug
        ? `${SITE}/article/${item.slug}`
        : `${SITE}/content/${item.id}`;
      sections.push(`
        <div style="margin:0 0 22px;padding:0 0 22px;border-bottom:1px solid ${RULE}">
          <a href="${href}" style="font-family:${serifStack};font-size:20px;line-height:1.3;font-weight:500;letter-spacing:-0.02em;color:${INK};text-decoration:none">
            ${escapeHtml(item.title)}
          </a>
          ${
            item.editorNote
              ? `<p style="margin:10px 0 0;padding-left:12px;border-left:1px solid ${RULE};font-family:${fontStack};font-size:13px;line-height:1.55;color:${MUTED}">
                  <span style="display:block;margin-bottom:4px;font-size:10px;letter-spacing:0.14em;text-transform:uppercase">Why this is here</span>
                  ${escapeHtml(item.editorNote)}
                </p>`
              : ""
          }
        </div>
      `);
    }
  }

  if (writing.length) {
    sections.push(`
      <p style="margin:8px 0 14px;font-family:${fontStack};font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED}">
        New writing
      </p>
      <ul style="margin:0 0 28px;padding:0;list-style:none">
    `);
    for (const item of writing.slice(0, 4)) {
      const href = item.slug
        ? `${SITE}/article/${item.slug}`
        : `${SITE}/content/${item.id}`;
      sections.push(`
        <li style="margin:0 0 12px">
          <a href="${href}" style="font-family:${serifStack};font-size:17px;line-height:1.35;font-weight:500;color:${INK};text-decoration:none">
            ${escapeHtml(item.title)}
          </a>
        </li>
      `);
    }
    sections.push("</ul>");
  }

  if (upcoming.length) {
    sections.push(`
      <p style="margin:8px 0 14px;font-family:${fontStack};font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED}">
        ${locationLabel ? `Near ${escapeHtml(locationLabel)}` : "Upcoming events"}
      </p>
      <ul style="margin:0 0 8px;padding:0;list-style:none">
    `);
    for (const event of upcoming) {
      sections.push(`
        <li style="margin:0 0 14px;padding:14px 16px;border:1px solid ${RULE};border-radius:14px">
          <div style="font-family:${fontStack};font-size:15px;font-weight:500;color:${INK}">
            ${escapeHtml(event.title)}
          </div>
          ${
            event.location
              ? `<div style="margin-top:4px;font-family:${fontStack};font-size:12px;color:${MUTED}">${escapeHtml(event.location)}</div>`
              : ""
          }
          ${
            event.url
              ? `<div style="margin-top:8px"><a href="${event.url}" style="font-family:${fontStack};font-size:12px;color:${INK};text-decoration:underline">Details</a></div>`
              : ""
          }
        </li>
      `);
    }
    sections.push("</ul>");
  }

  sections.push(`
    <p style="margin:32px 0 0;padding-top:20px;border-top:1px solid ${RULE};font-family:${fontStack};font-size:12px;line-height:1.5;color:${MUTED}">
      <a href="${SITE}" style="color:${MUTED};text-decoration:underline">Open the scene</a>
      ·
      <a href="${SITE}/settings/profile" style="color:${MUTED};text-decoration:underline">Update location</a>
      ·
      <a href="${SITE}/subscribe" style="color:${MUTED};text-decoration:underline">Digest</a>
    </p>
  `);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:${PAPER}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">
    A small weekly selection from thedesign.scene.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${PAPER}">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:42rem;width:100%">
          <tr>
            <td style="padding:0 0 28px;font-family:${fontStack};font-size:14px;font-weight:500;letter-spacing:-0.02em;color:${INK}">
              thedesign.scene
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;border:1px solid ${RULE};border-radius:18px;background:#fffefb">
              ${sections.join("\n")}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return {
    html,
    subject: locationLabel
      ? `This week in thedesign.scene · ${locationLabel}`
      : "This week in thedesign.scene",
    picks: picks.length,
    writing: writing.length,
    events: upcoming.length,
    locationLabel,
  };
}
