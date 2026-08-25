"use client";

import { useRef, useState, useTransition } from "react";

import { createJob } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function JobForm({ disabled }: { disabled?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createJob(formData);
      setMessage(result);
      if (result.ok) formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="space-y-4 rounded-2xl border border-border/70 bg-card p-6"
    >
      <div className="space-y-1">
        <h3 className="font-heading text-xl tracking-tight">Add an opening</h3>
        <p className="text-sm text-muted-foreground">
          UI / product design only — roles you’d recommend to a friend. Lands as
          a draft until you publish.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="job-title">Role title</Label>
          <Input
            id="job-title"
            name="title"
            required
            disabled={disabled || pending}
            placeholder="Senior Product Designer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-company">Company</Label>
          <Input
            id="job-company"
            name="company"
            required
            disabled={disabled || pending}
            placeholder="Studio name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-role-kind">Kind</Label>
          <Input
            id="job-role-kind"
            name="roleKind"
            disabled={disabled || pending}
            placeholder="Product Design"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-work-mode">Work mode</Label>
          <select
            id="job-work-mode"
            name="workMode"
            defaultValue="remote"
            disabled={disabled || pending}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On site</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-location">Location</Label>
          <Input
            id="job-location"
            name="location"
            disabled={disabled || pending}
            placeholder="London · Remote · etc."
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="job-url">Apply URL</Label>
          <Input
            id="job-url"
            name="url"
            type="url"
            disabled={disabled || pending}
            placeholder="https://"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="job-company-url">Company URL</Label>
          <Input
            id="job-company-url"
            name="companyUrl"
            type="url"
            disabled={disabled || pending}
            placeholder="https://"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="job-description">Brief</Label>
          <Textarea
            id="job-description"
            name="description"
            rows={3}
            disabled={disabled || pending}
            placeholder="One or two sentences — what the role is, calmly."
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="job-editor-note">Why this is here</Label>
          <Textarea
            id="job-editor-note"
            name="editorNote"
            rows={2}
            disabled={disabled || pending}
            placeholder="Optional — why you’d recommend this to a friend."
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {message ? (
            <span className={message.ok ? "" : "text-destructive"}>
              {message.message}
            </span>
          ) : (
            "Saves as draft"
          )}
        </p>
        <Button type="submit" disabled={disabled || pending}>
          {pending ? "Saving…" : "Save draft"}
        </Button>
      </div>
    </form>
  );
}
