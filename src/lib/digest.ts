import { and, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import { content, events, type Event } from "@/db/schema";

import {
  EMAIL,
  EMAIL_FONT,
  EMAIL_SERIF,
  emailCardFooter,
  emailEyebrow,
  escapeHtml,
  wrapEmailHtml,
} from "@/lib/email-layout";
import { SITE_NAME, SITE_ORIGIN } from "@/lib/site";

const SITE = SITE_ORIGIN;
const { ink, muted, rule } = EMAIL;

export type DigestPayload = {
  html: string;
  subject: string;
  picks: number;
  writing: number;
  events: number;
  posts: number;
  locationLabel?: string | null;
  skipped?: string;
};

export type DigestOptions = {
  location?: string | null;
};

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

function pickEventsForLocation(
  all: Event[],
  location: string | null | undefined
) {
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

function postScore(item: {
  title: string;
  excerpt: string | null;
}) {
  const text = `${item.title}\n${item.excerpt ?? ""}`.trim();
  let score = Math.min(text.length, 280);
  if (/\?/.test(text)) score += 20;
  if ((item.excerpt?.split(/\s+/).length ?? 0) >= 18) score += 30;
  if (/pic\.twitter\.com|t\.co\//i.test(text) && text.length < 120) score -= 40;
  if (/✨|🤓|😉/.test(text)) score -= 25;
  return score;
}

function pickRecentXPosts<
  T extends {
    id: string;
    title: string;
    excerpt: string | null;
    authorHandle: string | null;
    url: string | null;
    sourceUrl: string | null;
    publishedAt: Date | null;
  },
>(posts: T[], count = 3) {
  const ranked = [...posts]
    .filter((item) => {
      const text = `${item.title}\n${item.excerpt ?? ""}`.trim();
      return text.length >= 50;
    })
    .sort((a, b) => {
      const score = postScore(b) - postScore(a);
      if (score !== 0) return score;
      return (
        (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)
      );
    });

  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of ranked) {
    const key = (item.authorHandle ?? item.id).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= count) break;
  }
  return out;
}

/** Build this week’s digest HTML — shared email aesthetic + OS dark/light. */
export async function buildWeeklyDigest(
  options: DigestOptions = {}
): Promise<DigestPayload> {
  if (!db) {
    return {
      html: "",
      subject: `This week in ${SITE_NAME}`,
      picks: 0,
      writing: 0,
      events: 0,
      posts: 0,
      skipped: "Database not configured",
    };
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const location = options.location?.trim() || null;

  const [picks, freshWriting, upcomingAll, recentPosts] = await Promise.all([
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
    db.query.content.findMany({
      where: and(
        eq(content.status, "published"),
        eq(content.type, "post"),
        gte(content.publishedAt, weekAgo)
      ),
      orderBy: [desc(content.publishedAt)],
      limit: 20,
    }),
  ]);

  const writing = freshWriting.filter(
    (item) => item.type === "article" || item.type === "thought"
  );
  const upcoming = pickEventsForLocation(upcomingAll, location);
  const xPosts = pickRecentXPosts(recentPosts, 3);
  const locationLabel = location ? shortLocationLabel(location) : null;

  if (picks.length + writing.length + upcoming.length + xPosts.length < 2) {
    return {
      html: "",
      subject: `This week in ${SITE_NAME}`,
      picks: picks.length,
      writing: writing.length,
      events: upcoming.length,
      posts: xPosts.length,
      locationLabel,
      skipped: "Not enough curated items this week.",
    };
  }

  const sections: string[] = [];

  sections.push(`
    ${emailEyebrow("Editor’s selection", "0 0 10px")}
    <h1 class="ink title" style="margin:0 0 12px;font-family:${EMAIL_SERIF};font-weight:500;font-size:32px;line-height:1.15;letter-spacing:-0.02em;color:${ink}">
      Design worth sitting with
    </h1>
    <p class="muted" style="margin:0 0 28px;font-family:${EMAIL_FONT};font-size:15px;line-height:1.65;color:${muted}">
      A small weekly note from ${escapeHtml(SITE_NAME)} — writing first, then events${
        locationLabel ? ` near ${escapeHtml(locationLabel)}` : ""
      }.
    </p>
  `);

  if (picks.length) {
    sections.push(emailEyebrow("Editor’s picks"));
    for (const item of picks) {
      const href = item.slug
        ? `${SITE}/article/${item.slug}`
        : `${SITE}/content/${item.id}`;
      sections.push(`
        <div class="rule-b" style="margin:0 0 22px;padding:0 0 22px;border-bottom:1px solid ${rule}">
          <a class="ink link" href="${href}" style="font-family:${EMAIL_SERIF};font-size:20px;line-height:1.3;font-weight:500;letter-spacing:-0.02em;color:${ink};text-decoration:none">
            ${escapeHtml(item.title)}
          </a>
          ${
            item.editorNote
              ? `<p class="muted note" style="margin:10px 0 0;padding-left:12px;border-left:1px solid ${rule};font-family:${EMAIL_FONT};font-size:13px;line-height:1.55;color:${muted}">
                  <span class="eyebrow" style="display:block;margin-bottom:4px;font-size:10px;letter-spacing:0.14em;text-transform:uppercase">Why this is here</span>
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
      ${emailEyebrow("New writing", "8px 0 14px")}
      <ul style="margin:0 0 28px;padding:0;list-style:none">
    `);
    for (const item of writing.slice(0, 4)) {
      const href = item.slug
        ? `${SITE}/article/${item.slug}`
        : `${SITE}/content/${item.id}`;
      sections.push(`
        <li style="margin:0 0 12px">
          <a class="ink link" href="${href}" style="font-family:${EMAIL_SERIF};font-size:17px;line-height:1.35;font-weight:500;color:${ink};text-decoration:none">
            ${escapeHtml(item.title)}
          </a>
        </li>
      `);
    }
    sections.push("</ul>");
  }

  if (upcoming.length) {
    sections.push(`
      ${emailEyebrow(
        locationLabel ? `Near ${locationLabel}` : "Upcoming events",
        "8px 0 14px"
      )}
      <ul style="margin:0 0 8px;padding:0;list-style:none">
    `);
    for (const event of upcoming) {
      sections.push(`
        <li class="event-card" style="margin:0 0 14px;padding:14px 16px;border:1px solid ${rule};border-radius:14px">
          <div class="ink" style="font-family:${EMAIL_FONT};font-size:15px;font-weight:500;color:${ink}">
            ${escapeHtml(event.title)}
          </div>
          ${
            event.location
              ? `<div class="muted" style="margin-top:4px;font-family:${EMAIL_FONT};font-size:12px;color:${muted}">${escapeHtml(event.location)}</div>`
              : ""
          }
          ${
            event.url
              ? `<div style="margin-top:8px"><a class="ink" href="${event.url}" style="font-family:${EMAIL_FONT};font-size:12px;color:${ink};text-decoration:underline">Details</a></div>`
              : ""
          }
        </li>
      `);
    }
    sections.push("</ul>");
  }

  if (xPosts.length) {
    sections.push(`
      ${emailEyebrow("Notes from X", "20px 0 14px")}
      <p class="muted" style="margin:0 0 14px;font-family:${EMAIL_FONT};font-size:13px;line-height:1.5;color:${muted}">
        A few craft notes — separate from the editor’s selection.
      </p>
    `);
    for (const item of xPosts) {
      const href = item.url || item.sourceUrl || `${SITE}/content/${item.id}`;
      const handle = item.authorHandle?.replace(/^@/, "");
      const body = (item.excerpt?.trim() || item.title).slice(0, 220);
      sections.push(`
        <div class="event-card" style="margin:0 0 12px;padding:14px 16px;border:1px solid ${rule};border-radius:14px">
          ${
            handle
              ? `<div class="muted" style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:11px;letter-spacing:0.04em;color:${muted}">@${escapeHtml(handle)}</div>`
              : ""
          }
          <div class="ink" style="font-family:${EMAIL_FONT};font-size:14px;line-height:1.55;color:${ink}">
            ${escapeHtml(body)}${body.length >= 220 ? "…" : ""}
          </div>
          <div style="margin-top:8px">
            <a class="ink" href="${href}" style="font-family:${EMAIL_FONT};font-size:12px;color:${ink};text-decoration:underline">Open on X</a>
          </div>
        </div>
      `);
    }
  }

  sections.push(
    emailCardFooter(
      `<a class="muted" href="${SITE}" style="color:${muted};text-decoration:underline">Open the scene</a>
      ·
      <a class="muted" href="${SITE}/settings/profile" style="color:${muted};text-decoration:underline">Update location</a>
      ·
      <a class="muted" href="${SITE}/subscribe" style="color:${muted};text-decoration:underline">Digest</a>`,
      "32px 0 0"
    )
  );

  const html = wrapEmailHtml({
    preheader: `A small weekly selection from ${SITE_NAME}.`,
    body: sections.join("\n"),
  });

  return {
    html,
    subject: locationLabel
      ? `This week in ${SITE_NAME} · ${locationLabel}`
      : `This week in ${SITE_NAME}`,
    picks: picks.length,
    writing: writing.length,
    events: upcoming.length,
    posts: xPosts.length,
    locationLabel,
  };
}
