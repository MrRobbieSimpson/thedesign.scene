"use client";

import { useState, useTransition } from "react";

import { importRssSelection, loadRssSource } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { FEED_SOURCES } from "@/lib/ingest/sources";
import type { RssCandidate } from "@/lib/ingest/types";
import { formatPublishedDate } from "@/lib/format";

export function ImportRssPanel({ disabled }: { disabled?: boolean }) {
  const [sourceId, setSourceId] = useState(FEED_SOURCES[0]?.id ?? "handheld");
  const [items, setItems] = useState<RssCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function load() {
    setMessage(null);
    startTransition(async () => {
      const result = await loadRssSource(sourceId, 12);
      if (!result.ok) {
        setError(true);
        setMessage(result.message);
        setItems([]);
        return;
      }
      setError(false);
      setItems(result.items);
      setSelected(new Set());
      setMessage(`Loaded ${result.items.length} from ${result.source.name}.`);
    });
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function importSelected() {
    setMessage(null);
    startTransition(async () => {
      const result = await importRssSelection(sourceId, Array.from(selected));
      setError(!result.ok);
      setMessage(result.message);
      if (result.ok) setSelected(new Set());
    });
  }

  return (
    <div className="space-y-5 rounded-2xl border border-border/70 bg-card p-6">
      <div>
        <h2 className="font-heading text-2xl tracking-tight">Browse RSS</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pull candidates from Handheld, Dezeen, and other registered feeds.
          Import as drafts — nothing publishes automatically.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={sourceId}
          onChange={(event) => setSourceId(event.target.value)}
          disabled={disabled || pending}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {FEED_SOURCES.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || pending}
          onClick={load}
        >
          {pending && items.length === 0 ? "Loading…" : "Load latest"}
        </Button>
        <Button
          type="button"
          disabled={disabled || pending || selected.size === 0}
          onClick={importSelected}
        >
          Import selected ({selected.size})
        </Button>
      </div>

      {items.length > 0 ? (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
          {items.map((item) => {
            const checked = selected.has(item.externalId);
            return (
              <li key={item.externalId}>
                <label className="flex cursor-pointer gap-3 px-4 py-3 hover:bg-muted/30">
                  <input
                    type="checkbox"
                    className="mt-1 size-4"
                    checked={checked}
                    disabled={disabled || pending}
                    onChange={() => toggle(item.externalId)}
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="block truncate text-sm font-medium">
                      {item.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {item.authorName ?? "Unknown"}
                      {item.publishedAt
                        ? ` · ${formatPublishedDate(item.publishedAt)}`
                        : ""}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
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
