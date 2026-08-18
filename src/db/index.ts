import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

/**
 * Returns true when a Postgres connection string is configured.
 * Useful for falling back to demo data during local UI development.
 */
export function isDatabaseConfigured() {
  return Boolean(connectionString);
}

const client = connectionString
  ? postgres(connectionString, { prepare: false, max: 10 })
  : null;

export const db = client ? drizzle(client, { schema }) : null;
