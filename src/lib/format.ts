import { format, formatDistanceToNowStrict } from "date-fns";

import type { ContentType, EventType } from "@/db/schema";

export function formatPublishedDate(date: Date | null | undefined) {
  if (!date) return null;
  return format(date, "MMM d, yyyy");
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
  if (!date) return null;
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function formatEventRange(start: Date, end?: Date | null) {
  if (!end) return format(start, "MMM d, yyyy · h:mm a");
  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");
  if (sameDay) {
    return `${format(start, "MMM d, yyyy")} · ${format(start, "h:mm a")}–${format(end, "h:mm a")}`;
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

export function contentTypeLabel(type: ContentType) {
  switch (type) {
    case "article":
      return "Article";
    case "thought":
      return "Thought";
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
