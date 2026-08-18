"use client";

import { useState, useTransition } from "react";

import {
  confirmImportUrl,
  previewImportUrl,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTENT_TYPES } from "@/db/schema";
import type { ResolvedImport } from "@/lib/ingest/types";
import { contentTypeLabel } from "@/lib/format";

export function ImportUrlForm({ disabled }: { disabled?: boolean }) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<ResolvedImport | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function fetchPreview() {
    setMessage(null);
    startTransition(async () => {
      const result = await previewImportUrl(url);
      if (!result.ok) {
        setError(true);
        setMessage(result.message);
        setPreview(null);
        return;
      }
      setError(false);
      setPreview(result.data);
      setMessage("Preview ready — edit if needed, then import as draft.");
    });
  }

  function onConfirm(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await confirmImportUrl(formData);
      setError(!result.ok);
      setMessage(result.message);
      if (result.ok) {
        setPreview(null);
        setUrl("");
      }
    });
  }

  return (
    <div className="space-y-5 rounded-2xl border border-border/70 bg-card p-6">
      <div>
        <h2 className="font-heading text-2xl tracking-tight">Import URL</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste an X post, Layers project, Handheld issue, Dezeen story, or any
          design URL. We fetch metadata and save a draft.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://x.com/…/status/… or https://layers.to/…"
          disabled={disabled || pending}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || pending || !url.trim()}
          onClick={fetchPreview}
        >
          {pending && !preview ? "Fetching…" : "Fetch preview"}
        </Button>
      </div>

      {preview ? (
        <form action={onConfirm} className="space-y-4 border-t border-border/60 pt-5">
          <input type="hidden" name="url" value={url} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="import-title">Title</Label>
              <Input
                id="import-title"
                name="title"
                defaultValue={preview.title}
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-type">Type</Label>
              <select
                id="import-type"
                name="type"
                defaultValue={preview.type}
                disabled={pending}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {CONTENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {contentTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <Input
                value={`${preview.sourcePlatform}${preview.authorHandle ? ` · @${preview.authorHandle}` : ""}`}
                disabled
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="import-excerpt">Excerpt</Label>
              <Textarea
                id="import-excerpt"
                name="excerpt"
                defaultValue={preview.excerpt ?? ""}
                rows={4}
                disabled={pending}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="import-image">Image URL</Label>
              <Input
                id="import-image"
                name="image"
                defaultValue={preview.image ?? ""}
                disabled={pending}
              />
            </div>
          </div>

          <Button type="submit" disabled={disabled || pending}>
            {pending ? "Importing…" : "Import as draft"}
          </Button>
        </form>
      ) : null}

      {message ? (
        <p
          className={
            error ? "text-sm text-destructive" : "text-sm text-muted-foreground"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
