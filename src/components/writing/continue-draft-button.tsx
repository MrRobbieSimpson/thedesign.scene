"use client";

import { useWriting } from "@/components/writing/writing-context";
import { Button } from "@/components/ui/button";

export function ContinueDraftButton({
  id,
  title,
  body,
}: {
  id: string;
  title: string;
  body: string;
}) {
  const { openWriter } = useWriting();

  return (
    <Button
      type="button"
      size="sm"
      onClick={() => openWriter({ id, title, body })}
    >
      Continue
    </Button>
  );
}
