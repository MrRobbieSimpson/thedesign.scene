import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { demoContent, demoEvents, demoMakers } from "@/lib/demo-data";
import { content, events, makers } from "./schema";

config({ path: ".env.local" });

async function seed() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("Missing DATABASE_URL. Set it in .env.local before seeding.");
    process.exit(1);
  }

  const client = postgres(connectionString, { prepare: false, max: 1 });
  const db = drizzle(client);

  console.log("Seeding makers...");
  await db
    .insert(makers)
    .values(
      demoMakers.map(({ id, name, handle, bio, avatar, website }) => ({
        id,
        name,
        handle,
        bio,
        avatar,
        website,
      }))
    )
    .onConflictDoNothing();

  console.log("Seeding content...");
  await db
    .insert(content)
    .values(
      demoContent.map(
        ({
          id,
          type,
          title,
          url,
          excerpt,
          image,
          status,
          featured,
          makerId,
          publishedAt,
          sourcePlatform,
          sourceUrl,
          externalId,
          authorHandle,
          authorName,
          sourcePayload,
        }) => ({
          id,
          type,
          title,
          url,
          excerpt,
          image,
          status,
          featured,
          makerId,
          publishedAt,
          sourcePlatform,
          sourceUrl,
          externalId,
          authorHandle,
          authorName,
          sourcePayload,
        })
      )
    )
    .onConflictDoNothing();

  console.log("Seeding events...");
  await db
    .insert(events)
    .values(
      demoEvents.map(
        ({
          id,
          title,
          description,
          url,
          location,
          latitude,
          longitude,
          startDate,
          endDate,
          type,
          status,
          sourcePlatform,
          sourceUrl,
          externalId,
          sourcePayload,
        }) => ({
          id,
          title,
          description,
          url,
          location,
          latitude,
          longitude,
          startDate,
          endDate,
          type,
          status,
          sourcePlatform,
          sourceUrl,
          externalId,
          sourcePayload,
        })
      )
    )
    .onConflictDoNothing();

  await client.end();
  console.log("Seed complete.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
