"use client";

import { useState, useTransition } from "react";

import { setCommunityBadge } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function CommunityBadgeForm({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await setCommunityBadge(formData);
      setError(!result.ok);
      setMessage(result.message);
    });
  }

  return (
    <form
      action={onSubmit}
      className="space-y-4 rounded-2xl border border-border/70 bg-card p-6"
    >
      <div className="space-y-1">
        <h3 className="font-heading text-xl tracking-tight">Community badge</h3>
        <p className="text-sm text-muted-foreground">
          Founder for you. Founding writer for the first cohort (max 10).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="badge-handle">Handle</Label>
          <Input
            id="badge-handle"
            name="handle"
            required
            disabled={disabled || pending}
            placeholder="robbothecreat0r"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="badge-kind">Badge</Label>
          <select
            id="badge-kind"
            name="badge"
            defaultValue="founding_writer"
            disabled={disabled || pending}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="founder">Founder</option>
            <option value="founding_writer">Founding writer</option>
            <option value="none">None (clear)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {message ? (
            <span className={error ? "text-destructive" : ""}>{message}</span>
          ) : (
            "Sets the ribbon on their portfolio and bylines."
          )}
        </p>
        <Button type="submit" disabled={disabled || pending}>
          {pending ? "Saving…" : "Save badge"}
        </Button>
      </div>
    </form>
  );
}
