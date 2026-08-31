import { formatDistanceToNowStrict } from "date-fns";

import type { ContentType, EventType } from "@/db/schema";
import { SITE_LOCALE } from "@/lib/site";

/** Fixed zone so SSR (Vercel) and client hydrate the same calendar strings. */
const DISPLAY_TIME_ZONE = "Europe/London";

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function formatInZone(
  date: Date,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(SITE_LOCALE, {
    timeZone: DISPLAY_TIME_ZONE,
    ...options,
  }).format(date);
}

function ymdInZone(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatPublishedDate(date: Date | null | undefined) {
  const d = asDate(date);
  if (!d) return null;
  return formatInZone(d, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Quiet reading estimate — never “min read” urgency. */
export function formatSitWithTime(minutes: number | null | undefined) {
  if (!minutes || minutes < 1) return null;
  return `~${minutes} min to sit with`;
}

/** Compact variant for cards and attribution rows. */
export function formatSitWithTimeShort(minutes: number | null | undefined) {
  if (!minutes || minutes < 1) return null;
  return `~${minutes} min`;
}

export function formatRelativeDate(date: Date | null | undefined) {
  const d = asDate(date);
  if (!d) return null;
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function formatEventRange(start: Date, end?: Date | null) {
  const s = asDate(start);
  if (!s) return "";
  const e = asDate(end);

  const dayPart = formatInZone(s, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = formatInZone(s, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (!e) {
    return `${dayPart} · ${timePart}`;
  }

  if (ymdInZone(s) === ymdInZone(e)) {
    const endTime = formatInZone(e, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${dayPart} · ${timePart}–${endTime}`;
  }

  const endDay = formatInZone(e, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${formatInZone(s, { month: "short", day: "numeric" })} – ${endDay}`;
}

export function contentTypeLabel(type: ContentType) {
  switch (type) {
    case "article":
    case "thought":
      // Public surface: essays + notes are both “Writing”.
      return "Writing";
    case "visual":
      return "Visual";
    case "build":
      return "Visual";
    case "news":
      return "News";
    case "post":
      return "Post";
  }
}

export function sourcePlatformLabel(platform: string | null | undefined) {
  if (!platform) return null;
  switch (platform) {
    case "x":
      return "X";
    case "layers":
      return "Layers";
    case "handheld":
      return "Handheld";
    case "dezeen":
      return "Dezeen";
    case "dribbble":
      return "Dribbble";
    case "behance":
      return "Behance";
    case "awwwards":
      return "Awwwards";
    case "siteinspire":
      return "Siteinspire";
    case "spottedinprod":
      return "Spotted in Prod";
    case "medium":
      return "Medium";
    case "smashing":
      return "Smashing Magazine";
    case "luma":
      return "Luma";
    case "rss":
      return "RSS";
    case "web":
      return "Web";
    default:
      return platform;
  }
}

export function eventTypeLabel(type: EventType) {
  switch (type) {
    case "in-person":
      return "In person";
    case "hybrid":
      return "Hybrid";
    case "remote":
      return "Remote";
  }
}

export function jobWorkModeLabel(mode: "remote" | "hybrid" | "onsite") {
  switch (mode) {
    case "remote":
      return "Remote";
    case "hybrid":
      return "Hybrid";
    case "onsite":
      return "On site";
  }
}
