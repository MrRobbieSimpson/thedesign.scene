/**
 * Backfill latitude/longitude for published events missing map pins.
 * Also marks clearly-online events as remote so they don’t pretend to be local.
 *
 *   npx tsx scripts/backfill-event-coords.ts
 */
import { config } from "dotenv";
import { and, eq, isNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { events } from "../src/db/schema";
import { geocodeLocation, geocodeQueryForEvent } from "../src/lib/geo";

config({ path: ".env.local" });

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  const rows = await db.query.events.findMany({
    where: and(
      eq(events.status, "published"),
      or(isNull(events.latitude), isNull(events.longitude))
    ),
  });

  console.log(`Found ${rows.length} published events without coordinates`);

  let updated = 0;
  let remote = 0;
  let skipped = 0;

  for (const event of rows) {
    const online =
      /online|remote|virtual|on[\s-]?demand/i.test(event.title) ||
      /online|remote|virtual/i.test(event.location ?? "");

    if (online && event.type !== "remote") {
      await db
        .update(events)
        .set({ type: "remote", updatedAt: new Date() })
        .where(eq(events.id, event.id));
      remote += 1;
      console.log(`  ☁ remote  ${event.title.slice(0, 70)}`);
      // Online events don’t need a pin.
      continue;
    }

    const query = geocodeQueryForEvent({
      location: event.location,
      title: event.title,
    });
    if (!query) {
      skipped += 1;
      console.log(`  · skip    ${event.title.slice(0, 70)}`);
      continue;
    }

    // Nominatim usage policy: max ~1 req/sec.
    await sleep(1100);
    const geo = await geocodeLocation(query);
    if (!geo) {
      skipped += 1;
      console.log(`  ✗ geo     ${query} ← ${event.title.slice(0, 50)}`);
      continue;
    }

    await db
      .update(events)
      .set({
        latitude: geo.latitude,
        longitude: geo.longitude,
        // Keep venue text; if missing, store a short place label.
        location: event.location?.trim() || geo.label || query,
        updatedAt: new Date(),
      })
      .where(eq(events.id, event.id));
    updated += 1;
    console.log(
      `  ✓ ${geo.latitude.toFixed(3)},${geo.longitude.toFixed(3)}  ${event.title.slice(0, 60)}`
    );
  }

  console.log(
    `\nDone. coords=${updated} remote=${remote} skipped=${skipped}`
  );
  await client.end({ timeout: 5 });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
