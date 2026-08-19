"use client";

import { Button } from "@/components/ui/button";

export function PublishDialog({
  open,
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 px-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-dialog-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card p-6 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.5)]">
        <p
          id="publish-dialog-title"
          className="font-heading text-xl tracking-tight"
        >
          Publish this to the scene?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          It’ll appear on the feed and on your portfolio.
        </p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={pending}
          >
            Keep editing
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={pending}
          >
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
