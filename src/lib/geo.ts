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

export type GeocodeResult = Coordinates & {
  /** Nominatim display name when available. */
  label?: string;
};

/**
 * Build a geocode query from an event’s location and/or title.
 * Prefers explicit venue text; falls back to a city name in the title.
 */
export function geocodeQueryForEvent(input: {
  location?: string | null;
  title?: string | null;
}): string | null {
  const location = input.location?.trim();
  if (location && !/online|remote|virtual/i.test(location)) {
    return location;
  }

  const title = input.title?.trim() ?? "";
  if (!title) return null;
  if (/online|remote|virtual|on[\s-]?demand/i.test(title)) return null;

  const city = title.match(
    /\b(London|Berlin|Amsterdam|Belfast|Dublin|Paris|Lisbon|Madrid|Barcelona|Munich|Hamburg|Rotterdam|Utrecht|Manchester|Edinburgh|Glasgow|Brighton|Bristol|New York|San Francisco|Los Angeles|Chicago|Toronto|Copenhagen|Stockholm|Oslo|Helsinki|Vienna|Zurich|Milan|Rome|Prague|Warsaw|Lisbon)\b/i
  );
  return city?.[1] ?? null;
}

/**
 * Lightweight geocode via OpenStreetMap Nominatim (respect usage policy).
 * Returns null when nothing useful is found.
 */
export async function geocodeLocation(
  query: string
): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed || /online|remote|virtual/i.test(trimmed)) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  // Prefer settlements when the query is a bare city name.
  if (!/,/.test(trimmed) && trimmed.split(/\s+/).length <= 3) {
    url.searchParams.set("featuretype", "settlement");
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "sitwithdesign/1.0 (curated design events)",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name?: string;
  }>;
  if (!data[0]) return null;

  const latitude = Number(data[0].lat);
  const longitude = Number(data[0].lon);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

  return {
    latitude,
    longitude,
    label: data[0].display_name?.split(",").slice(0, 2).join(",").trim(),
  };
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
