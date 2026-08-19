"use client";

import { useWriting } from "@/components/writing/writing-context";
import { Button } from "@/components/ui/button";

export function ContinueDraftButton({
  id,
  title,
  body,
  excerpt,
  image,
}: {
  id: string;
  title: string;
  body: string;
  excerpt?: string | null;
  image?: string | null;
}) {
  const { openWriter } = useWriting();

  return (
    <Button
      type="button"
      size="sm"
      onClick={() =>
        openWriter({
          id,
          title,
          body,
          excerpt: excerpt ?? "",
          image: image ?? "",
        })
      }
    >
      Continue
    </Button>
  );
}
