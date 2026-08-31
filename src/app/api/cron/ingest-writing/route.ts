import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/db";
import { pullWritingDrafts } from "@/lib/ingest/pull-writing-drafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** RSS fetches across many sources — allow a longer window. */
export const maxDuration = 60;

function requireCronAuth(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  const cronOk = requireCronAuth(request);
  const adminOk = await isAdmin().catch(() => false);
  if (!cronOk && !adminOk) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, message: "Database not configured" },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  try {
    const result = await pullWritingDrafts({ dryRun });
    return NextResponse.json({
      ok: true,
      dryRun,
      ...result,
      message: dryRun
        ? `Dry run — would import up to ${result.imported} writing drafts.`
        : `Imported ${result.imported} writing drafts (${result.skipped} skipped, ${result.rejected} rejected).`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Writing ingest failed",
      },
      { status: 500 }
    );
  }
}
