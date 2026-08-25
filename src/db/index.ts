import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Read + validate at call / module init so empty or placeholder
 * values (e.g. dashboard typos) don’t look “configured”.
 */
function readConnectionString() {
  const value = process.env.DATABASE_URL?.trim() ?? "";
  if (!value) return null;
  if (!/^postgres(ql)?:\/\//i.test(value)) return null;
  return value;
}

/**
 * Returns true when a Postgres connection string is configured.
 * Useful for falling back to demo data during local UI development.
 */
export function isDatabaseConfigured() {
  return Boolean(readConnectionString());
}

const connectionString = readConnectionString();

const client = connectionString
  ? postgres(connectionString, {
      prepare: false,
      // Serverless-friendly: one connection per isolate avoids pool churn.
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : null;

export const db = client ? drizzle(client, { schema }) : null;
