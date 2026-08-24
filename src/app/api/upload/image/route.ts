import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getClerkUserId } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 4.5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function safeName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "image"
  );
}

/** Resolve Blob store id — supports default + custom Vercel prefixes. */
function resolveStoreId() {
  return (
    process.env.BLOB_STORE_ID?.trim() ||
    process.env.designscene_STORE_ID?.trim() ||
    null
  );
}

function hasBlobCredentials() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      (process.env.VERCEL_OIDC_TOKEN?.trim() && resolveStoreId())
  );
}

export async function POST(request: Request) {
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to upload." }, { status: 401 });
  }

  if (!hasBlobCredentials()) {
    return NextResponse.json(
      {
        error:
          "Image uploads aren’t configured yet. Connect the Blob store to this project (include Development) and run `vercel env pull`.",
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, WebP, or GIF." },
      { status: 400 }
    );
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be under 4.5MB." },
      { status: 413 }
    );
  }

  const pathname = `articles/${userId}/${Date.now()}-${safeName(file.name)}`;
  const storeId = resolveStoreId();
  const rwToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  try {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true,
      // Prefer OIDC on Vercel; fall back to static RW token for local/CI.
      ...(rwToken
        ? { token: rwToken }
        : storeId
          ? { storeId }
          : {}),
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("blob upload failed", error);
    return NextResponse.json(
      { error: "Upload failed. Try again in a moment." },
      { status: 500 }
    );
  }
}
