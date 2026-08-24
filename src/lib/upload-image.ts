/**
 * Client helper — upload an article image to /api/upload/image.
 */
export async function uploadArticleImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/upload/image", {
    method: "POST",
    body,
  });

  const data = (await response.json().catch(() => null)) as {
    url?: string;
    error?: string;
  } | null;

  if (!response.ok || !data?.url) {
    throw new Error(data?.error || "Upload failed.");
  }

  return data.url;
}
