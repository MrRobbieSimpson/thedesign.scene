"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileLink } from "@/db/schema";

const MAX_LINKS = 8;

type Row = { id: string; label: string; url: string };

function toRows(links: ProfileLink[]): Row[] {
  if (!links.length) {
    return [{ id: crypto.randomUUID(), label: "", url: "" }];
  }
  return links.map((link) => ({
    id: crypto.randomUUID(),
    label: link.label,
    url: link.url,
  }));
}

export function ProfileLinksFields({
  initialLinks = [],
}: {
  initialLinks?: ProfileLink[] | null;
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(initialLinks ?? []));

  function updateRow(id: string, patch: Partial<Omit<Row, "id">>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  function removeRow(id: string) {
    setRows((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length ? next : [{ id: crypto.randomUUID(), label: "", url: "" }];
    });
  }

  function addRow() {
    setRows((current) => {
      if (current.length >= MAX_LINKS) return current;
      return [...current, { id: crypto.randomUUID(), label: "", url: "" }];
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Links</Label>
        <p className="text-xs text-muted-foreground">
          Optional — LinkedIn, Are.na, or anywhere else. Only filled rows show
          on your portfolio.
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-2 sm:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)_auto]"
          >
            <Input
              name="linkLabel"
              value={row.label}
              onChange={(event) =>
                updateRow(row.id, { label: event.target.value })
              }
              placeholder="LinkedIn"
              aria-label={`Link ${index + 1} label`}
              autoComplete="off"
            />
            <Input
              name="linkUrl"
              type="url"
              value={row.url}
              onChange={(event) =>
                updateRow(row.id, { url: event.target.value })
              }
              placeholder="https://"
              aria-label={`Link ${index + 1} URL`}
              autoComplete="url"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => removeRow(row.id)}
              aria-label={`Remove link ${index + 1}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={rows.length >= MAX_LINKS}
        className="gap-1.5"
      >
        <Plus className="size-3.5" />
        Add link
        {rows.length >= MAX_LINKS ? (
          <span className="text-muted-foreground">· max {MAX_LINKS}</span>
        ) : null}
      </Button>
    </div>
  );
}
