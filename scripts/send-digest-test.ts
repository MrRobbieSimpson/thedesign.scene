/**
 * One-off digest test send.
 *
 *   npx tsx scripts/send-digest-test.ts robsimpson93@gmail.com
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { Resend } from "resend";

import { buildWeeklyDigest } from "../src/lib/digest";

async function main() {
  const to = (process.argv[2] || "").trim().toLowerCase();
  if (!to) {
    console.error("Usage: npx tsx scripts/send-digest-test.ts you@email.com");
    process.exit(1);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DIGEST_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error("Missing RESEND_API_KEY or DIGEST_FROM_EMAIL in .env.local");
    process.exit(1);
  }

  const digest = await buildWeeklyDigest();
  if (digest.skipped) {
    console.error("Skipped:", digest.skipped);
    console.error(
      `Counts — picks:${digest.picks} writing:${digest.writing} events:${digest.events}`
    );
    process.exit(1);
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    subject: `[Test] ${digest.subject}`,
    html: digest.html,
  });

  console.log("Sent test digest to", to);
  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
