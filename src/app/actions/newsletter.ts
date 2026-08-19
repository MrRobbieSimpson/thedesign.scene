"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

export async function subscribeToDigest(formData: FormData) {
  if (!db) {
    return { ok: false as const, message: "Database not configured." };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, message: "Enter a valid email." };
  }

  const existing = await db.query.newsletterSubscribers.findFirst({
    where: eq(newsletterSubscribers.email, email),
  });

  if (existing) {
    if (existing.status === "active") {
      return { ok: true as const, message: "You’re already on the list." };
    }
    await db
      .update(newsletterSubscribers)
      .set({
        status: "active",
        confirmedAt: new Date(),
        unsubscribedAt: null,
      })
      .where(eq(newsletterSubscribers.id, existing.id));
    revalidatePath("/subscribe");
    return { ok: true as const, message: "Welcome back — subscribed." };
  }

  await db.insert(newsletterSubscribers).values({
    email,
    status: "active",
    confirmedAt: new Date(),
  });

  revalidatePath("/subscribe");
  return { ok: true as const, message: "You’re on the list. See you Thursday." };
}
