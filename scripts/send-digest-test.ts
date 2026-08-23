/**
 * One-off digest test send.
 *
 *   npx tsx scripts/send-digest-test.ts robsimpson93@gmail.com
 */
import { config } from "dotenv";
config({ path: ".env.local" });

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

  // Dynamic imports after dotenv so DATABASE_URL is available.
  const { Resend } = await import("resend");
  const { buildWeeklyDigest } = await import("../src/lib/digest");

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

  if (result.error) {
    console.error("Resend error:", result.error);
    process.exit(1);
  }

  console.log("Sent test digest to", to);
  console.log("id:", result.data?.id);
  console.log(
    `Content — picks:${digest.picks} writing:${digest.writing} events:${digest.events}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
