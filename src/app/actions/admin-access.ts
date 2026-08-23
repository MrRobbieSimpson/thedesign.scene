"use server";

import { isAdmin } from "@/lib/auth";

/** Client-safe check for showing Admin chrome. */
export async function checkIsAdmin() {
  try {
    return await isAdmin();
  } catch {
    return false;
  }
}
