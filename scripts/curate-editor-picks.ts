/**
 * Soften X in the main selection and seed a few editor notes.
 *
 *   npx tsx scripts/curate-editor-picks.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { content } from "../src/db/schema";

const PICKS: Array<{ id: string; note: string; feature?: boolean }> = [
  {
    id: "07314911-2893-4b4c-bd6d-47147de0e7e3",
    feature: true,
    note: "A sharp reminder that titles don’t make the work — the work does.",
  },
  {
    id: "d6f86abb-abf6-492b-b20e-c506223525f4",
    feature: true,
    note: "Quiet craft advice that rewards a slower read.",
  },
  {
    id: "21d5e4b7-c036-4fd7-8cdf-5ef23966f6ab",
    feature: true,
    note: "On reading as practice, not performance — rare and worth keeping.",
  },
  {
    id: "77736351-ec7b-4361-9665-4400161031a2",
    feature: true,
    note: "Clear teaching on a hard CSS problem, without the usual hot-take noise.",
  },
  {
    id: "5d7cf944-dff6-4582-b51d-1653a07a1bc7",
    feature: true,
    note: "Makes the case for human-led research when AI is tempting a shortcut.",
  },
  {
    id: "bae032f6-ad22-44cc-b382-bf39cf2dc6ec",
    feature: true,
    note: "A weekly roundup that still feels curated — colour systems with soul.",
  },
  {
    id: "4e766751-3b58-441b-ae9a-15c1f246b311",
    feature: true,
    note: "Calm mobile craft, ranked with a point of view.",
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL missing");
  }

  const client = postgres(process.env.DATABASE_URL, {
    prepare: false,
    max: 1,
  });
  const db = drizzle(client, { schema });

  // Unfeature every X post — they belong in Notes from X, not editor picks.
  const unfeatured = await db
    .update(content)
    .set({ featured: false, editorNote: null })
    .where(and(eq(content.type, "post"), eq(content.featured, true)))
    .returning({ id: content.id });

  console.log(`Unfeatured ${unfeatured.length} X posts`);

  for (const pick of PICKS) {
    const [row] = await db
      .update(content)
      .set({
        featured: pick.feature ?? true,
        editorNote: pick.note,
      })
      .where(eq(content.id, pick.id))
      .returning({ id: content.id, title: content.title });

    if (row) {
      console.log(`✓ ${row.title}`);
      console.log(`  → ${pick.note}`);
    } else {
      console.log(`✗ missing ${pick.id}`);
    }
  }

  const featured = await db.query.content.findMany({
    where: and(eq(content.status, "published"), eq(content.featured, true)),
    columns: {
      id: true,
      type: true,
      title: true,
      editorNote: true,
    },
  });

  console.log("\nFeatured now:");
  for (const item of featured) {
    console.log(
      `  [${item.type}] ${item.title} — ${item.editorNote ? "note ✓" : "NO NOTE"}`
    );
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
