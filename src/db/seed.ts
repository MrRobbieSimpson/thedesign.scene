import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * Intentionally empty. thedesign.scene starts blank —
 * content comes from writers, admin imports, and curation.
 *
 * Usage: npm run db:seed
 */
async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL.");
    process.exit(1);
  }

  console.log("No seed data. Database left as-is (use admin / Write to add content).");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
