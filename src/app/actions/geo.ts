"use server";

import { geocodeLocation } from "@/lib/geo";

export type ResolveCityResult =
  | {
      ok: true;
      label: string;
      latitude: number;
      longitude: number;
    }
  | { ok: false; message: string };

/**
 * Geocode a free-text city for guest “Find near me” — no auth required.
 */
export async function resolveCity(query: string): Promise<ResolveCityResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { ok: false, message: "Enter a city name." };
  }
  if (trimmed.length > 80) {
    return { ok: false, message: "That place name is a bit long." };
  }

  const coords = await geocodeLocation(trimmed);
  if (!coords) {
    return {
      ok: false,
      message: "Couldn’t find that place. Try a city name like London or Belfast.",
    };
  }

  const label =
    trimmed
      .split(",")[0]
      ?.trim()
      .replace(/\b\w/g, (c) => c.toUpperCase()) || trimmed;

  return {
    ok: true,
    label,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}
