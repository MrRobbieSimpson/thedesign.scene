/** Earth radius in kilometers */
const EARTH_KM = 6371;

export type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * Great-circle distance between two points (Haversine), in kilometers.
 */
export function distanceKm(a: Coordinates, b: Coordinates) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistanceKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  if (km < 100) return `${Math.round(km)} km`;
  return `${Math.round(km / 10) * 10} km`;
}

/**
 * Lightweight geocode via OpenStreetMap Nominatim (respect usage policy).
 * Returns null when nothing useful is found.
 */
export async function geocodeLocation(
  query: string
): Promise<Coordinates | null> {
  const trimmed = query.trim();
  if (!trimmed || /online|remote|virtual/i.test(trimmed)) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "sitwithdesign/1.0 (curated design events)",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as Array<{ lat: string; lon: string }>;
  if (!data[0]) return null;

  const latitude = Number(data[0].lat);
  const longitude = Number(data[0].lon);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

  return { latitude, longitude };
}

/**
 * Resolve an IANA timezone for a free-text place name via geocode + Open-Meteo.
 * Returns null when the place can’t be resolved.
 */
export async function timezoneFromLocation(
  query: string | null | undefined
): Promise<string | null> {
  const trimmed = query?.trim();
  if (!trimmed) return null;

  const coords = await geocodeLocation(trimmed);
  if (!coords) return null;

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(coords.latitude));
  url.searchParams.set("longitude", String(coords.longitude));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "1");

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { timezone?: string };
    const zone = data.timezone?.trim();
    if (!zone) return null;
    // Validate it is a real IANA zone the runtime knows.
    try {
      Intl.DateTimeFormat(undefined, { timeZone: zone });
      return zone;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}
