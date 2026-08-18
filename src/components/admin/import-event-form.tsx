"use client";

import { useState, useTransition } from "react";

import {
  confirmEventImport,
  previewEventUrl,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ResolvedEvent } from "@/lib/ingest/event-resolve";

function toDatetimeLocal(date: Date) {
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ImportEventForm({ disabled }: { disabled?: boolean }) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<ResolvedEvent | null>(null);
  const [needsDates, setNeedsDates] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function fetchPreview() {
    setMessage(null);
    startTransition(async () => {
      const result = await previewEventUrl(url);
      if (!result.ok) {
        setError(true);
        setMessage(result.message);
        setPreview(null);
        return;
      }
      setError(false);
      setPreview(result.data);
      setNeedsDates(result.needsDates);
      setMessage(
        result.needsDates
          ? "Preview ready — add start/end dates, then import."
          : "Preview ready — edit if needed, then import as draft."
      );
    });
  }

  function onConfirm(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await confirmEventImport(formData);
      setError(!result.ok);
      setMessage(result.message);
      if (result.ok && result.message.includes("draft")) {
        setPreview(null);
        setUrl("");
        setNeedsDates(false);
      }
    });
  }

  return (
    <div className="space-y-5 rounded-2xl border border-border/70 bg-card p-6">
      <div>
        <h2 className="font-heading text-2xl tracking-tight">Import event</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a conference or meetup URL (Config, UX London, Luma, Eventbrite,
          etc.). We read JSON-LD / Open Graph when available.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://config.figma.com/ or https://2026.uxlondon.com/"
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
        <form
          action={onConfirm}
          className="space-y-4 border-t border-border/60 pt-5"
        >
          <input type="hidden" name="url" value={url} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                name="title"
                defaultValue={preview.title}
                disabled={pending}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                name="description"
                defaultValue={preview.description ?? ""}
                rows={3}
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                name="location"
                defaultValue={preview.location ?? ""}
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-type">Type</Label>
              <select
                id="event-type"
                name="type"
                defaultValue={preview.type}
                disabled={pending}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="in-person">In person</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-start">
                Start {needsDates ? "(required)" : ""}
              </Label>
              <Input
                id="event-start"
                name="startDate"
                type="datetime-local"
                required={needsDates}
                defaultValue={toDatetimeLocal(preview.startDate)}
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-end">End</Label>
              <Input
                id="event-end"
                name="endDate"
                type="datetime-local"
                defaultValue={
                  preview.endDate ? toDatetimeLocal(preview.endDate) : ""
                }
                disabled={pending}
              />
            </div>

            <p className="text-xs text-muted-foreground sm:col-span-2">
              Coordinates power “Find near me”. Leave blank to auto-geocode from
              the location text when possible.
            </p>
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
