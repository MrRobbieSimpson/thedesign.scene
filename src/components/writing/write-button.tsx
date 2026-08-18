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
      aria-label="Start writing"
      className="h-8 gap-1.5 px-2 sm:px-2.5"
    >
      <PenLine className="size-3.5 shrink-0" />
      <span className="hidden sm:inline">Start writing</span>
    </Button>
  );
}
