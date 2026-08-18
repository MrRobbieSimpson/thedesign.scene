/**
 * Import upcoming Belfast Design Luma events into Neon.
 *
 *   npx tsx scripts/pull-belfast-design.ts
 */
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { events } from "../src/db/schema";
import {
  BELFAST_DESIGN_LUMA,
  fetchBelfastDesignEvents,
} from "../src/lib/ingest/luma";

config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  const items = await fetchBelfastDesignEvents();
  console.log(`Fetched ${items.length} Belfast Design events`);

  let created = 0;
  let skipped = 0;

  for (const item of items) {
    const externalId = item.apiId;
    const existing = await db.query.events.findFirst({
      where: and(
        eq(events.sourcePlatform, "luma"),
        eq(events.externalId, externalId)
      ),
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await db.insert(events).values({
      title: item.name,
      description:
        item.description ||
        `Hosted by ${BELFAST_DESIGN_LUMA.name}. More at ${BELFAST_DESIGN_LUMA.profileUrl}`,
      url: item.url,
      location: item.location ?? "Belfast, Northern Ireland",
      latitude: item.latitude,
      longitude: item.longitude,
      startDate: item.startAt,
      endDate: item.endAt,
      type: "in-person",
      status: "published",
      sourcePlatform: "luma",
      sourceUrl: item.url,
      externalId,
      sourcePayload: {
        calendar: BELFAST_DESIGN_LUMA.calendarApiId,
        username: BELFAST_DESIGN_LUMA.username,
        coverUrl: item.coverUrl,
      },
    });
    created += 1;
    console.log(`  ✓ ${item.name} — ${item.startAt.toISOString()}`);
  }

  console.log({ created, skipped });
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
