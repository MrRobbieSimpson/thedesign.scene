"use client";

import { PenLine } from "lucide-react";

import { useWriting } from "@/components/writing/writing-context";
import { Button } from "@/components/ui/button";

export function WriteButton() {
  const { openWriter } = useWriting();

  return (
    <Button
      type="button"
      size="sm"
      onClick={() => openWriter()}
      className="gap-1.5"
    >
      <PenLine className="size-3.5" />
      Write
    </Button>
  );
}
