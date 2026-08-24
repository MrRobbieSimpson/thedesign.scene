export type LumaEvent = {
  apiId: string;
  name: string;
  description: string | null;
  url: string;
  startAt: Date;
  endAt: Date | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  coverUrl: string | null;
};

/** Belfast city centre — used when Luma omits coordinates */
export const BELFAST_COORDS = {
  latitude: 54.5973,
  longitude: -5.9304,
} as const;

/** ~60km covers greater Belfast and nearby towns */
export const BELFAST_NEAR_KM = 60;

export const BELFAST_DESIGN_LUMA = {
  username: "belfastdesign",
  calendarApiId: "cal-MgDyGRMnVOzEr8r",
  profileUrl: "https://luma.com/user/belfastdesign",
  name: "Belfast Design",
} as const;

type LumaApiEvent = {
  api_id?: string;
  name?: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  url?: string;
  cover_url?: string;
  location_type?: string;
  geo_address_info?: {
    city?: string;
    short_address?: string;
    full_address?: string;
    place_coordinate?: { latitude?: number; longitude?: number };
  } | null;
};

function mapEvent(raw: LumaApiEvent): LumaEvent | null {
  if (!raw.api_id || !raw.name || !raw.start_at) return null;
  const geo = raw.geo_address_info;
  const coord = geo?.place_coordinate;
  const location =
    geo?.full_address ||
    geo?.short_address ||
    (geo?.city ? `${geo.city}` : null);

  let latitude = coord?.latitude ?? null;
  let longitude = coord?.longitude ?? null;

  // Default Belfast Design offline events to Belfast centre
  if (
    (latitude == null || longitude == null) &&
    raw.location_type === "offline"
  ) {
    latitude = BELFAST_COORDS.latitude;
    longitude = BELFAST_COORDS.longitude;
  }

  return {
    apiId: raw.api_id,
    name: raw.name,
    description: raw.description ?? null,
    url: raw.url ? `https://lu.ma/${raw.url}` : BELFAST_DESIGN_LUMA.profileUrl,
    startAt: new Date(raw.start_at),
    endAt: raw.end_at ? new Date(raw.end_at) : null,
    location,
    latitude,
    longitude,
    coverUrl: raw.cover_url ?? null,
  };
}

/**
 * Fetch upcoming public events from a Luma calendar.
 */
export async function fetchLumaCalendarEvents(
  calendarApiId: string,
  limit = 30
): Promise<LumaEvent[]> {
  const endpoint = new URL("https://api.lu.ma/calendar/get-items");
  endpoint.searchParams.set("calendar_api_id", calendarApiId);
  endpoint.searchParams.set("pagination_limit", String(limit));

  const response = await fetch(endpoint.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "sitwithdesign/1.0 (curated design events)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Luma calendar fetch failed (${response.status})`);
  }

  const data = (await response.json()) as {
    entries?: Array<{ event?: LumaApiEvent }>;
  };

  return (data.entries ?? [])
    .map((entry) => mapEvent(entry.event ?? {}))
    .filter((event): event is LumaEvent => Boolean(event))
    .filter((event) => event.startAt.getTime() >= Date.now() - 86_400_000);
}

export async function fetchBelfastDesignEvents() {
  return fetchLumaCalendarEvents(BELFAST_DESIGN_LUMA.calendarApiId);
}
