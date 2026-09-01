"use client";

import { useState, useTransition } from "react";

import { submitArticleFeature } from "@/app/actions/feature-article";
import { Button } from "@/components/ui/button";

export function FeatureBoostButton({
  contentId,
  label,
}: {
  contentId: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        disabled={pending}
        className="h-9 border-0 bg-foreground px-4 text-background hover:bg-foreground/90 hover:text-background"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await submitArticleFeature(contentId);
            if (result && !result.ok) setError(result.message);
          });
        }}
      >
        {pending ? "Starting checkout…" : label}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
