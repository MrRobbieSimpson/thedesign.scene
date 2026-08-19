"use client";

import { useState, useTransition } from "react";

import { createGuestTerm } from "@/app/actions/guest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/db/schema";

export function GuestEditorForm({
  profiles,
  disabled,
}: {
  profiles: Profile[];
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await createGuestTerm(formData);
      setError(!result.ok);
      setMessage(result.message);
    });
  }

  return (
    <form
      action={onSubmit}
      className="space-y-5 rounded-2xl border border-border/70 bg-card p-6"
    >
      <div>
        <h2 className="font-heading text-2xl tracking-tight">Guest editor</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Elevate a registered designer for a month — badge, home strip, light
          feed boost.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="profileId">Designer</Label>
          <select
            id="profileId"
            name="profileId"
            required
            disabled={disabled || pending || profiles.length === 0}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            defaultValue=""
          >
            <option value="" disabled>
              {profiles.length ? "Select profile" : "No profiles yet"}
            </option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.displayName ?? "Designer"}
                {profile.handle ? ` (@${profile.handle})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            name="label"
            required
            disabled={disabled || pending}
            placeholder="Guest Editor · March 2026"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startsAt">Starts</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            disabled={disabled || pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endsAt">Ends</Label>
          <Input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            required
            disabled={disabled || pending}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="intro">Intro</Label>
          <Textarea
            id="intro"
            name="intro"
            disabled={disabled || pending}
            placeholder="A calm sentence on their taste…"
            rows={2}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button type="submit" disabled={disabled || pending || profiles.length === 0}>
          {pending ? "Saving…" : "Create term"}
        </Button>
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
    </form>
  );
}
