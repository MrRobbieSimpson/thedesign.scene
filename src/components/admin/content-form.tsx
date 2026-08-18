"use client";

import { useState, useTransition } from "react";

import { createContent } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTENT_TYPES } from "@/db/schema";
import { contentTypeLabel } from "@/lib/format";

export function ContentForm({ disabled }: { disabled?: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await createContent(formData);
      setError(!result.ok);
      setMessage(result.message);
      if (result.ok) {
        const form = document.getElementById(
          "create-content-form"
        ) as HTMLFormElement | null;
        form?.reset();
      }
    });
  }

  return (
    <form
      id="create-content-form"
      action={onSubmit}
      className="space-y-5 rounded-2xl border border-border/70 bg-card p-6"
    >
      <div>
        <h2 className="font-heading text-2xl tracking-tight">New content</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a draft or publish immediately. Unprotected in Phase 1.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            disabled={disabled || pending}
            placeholder="A clear, calm title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            required
            disabled={disabled || pending}
            defaultValue="thought"
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
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            disabled={disabled || pending}
            defaultValue="draft"
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            name="excerpt"
            disabled={disabled || pending}
            placeholder="A short editorial blurb…"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            name="url"
            type="url"
            disabled={disabled || pending}
            placeholder="https://"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Image URL</Label>
          <Input
            id="image"
            name="image"
            type="url"
            disabled={disabled || pending}
            placeholder="https://"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sourcePlatform">Source platform</Label>
          <Input
            id="sourcePlatform"
            name="sourcePlatform"
            disabled={disabled || pending}
            placeholder="x, layers, handheld, dezeen…"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="authorHandle">Author handle</Label>
          <Input
            id="authorHandle"
            name="authorHandle"
            disabled={disabled || pending}
            placeholder="@handle"
          />
        </div>

        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="featured"
            disabled={disabled || pending}
            className="size-4 rounded border-input"
          />
          Featured
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button type="submit" disabled={disabled || pending}>
          {pending ? "Saving…" : "Create"}
        </Button>
        {message ? (
          <p
            className={
              error
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
