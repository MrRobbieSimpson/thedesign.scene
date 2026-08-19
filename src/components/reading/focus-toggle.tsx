"use client";

import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Toggles a calm focus class on <html> for distraction-light reading.
 */
export function FocusToggle() {
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("reading-focus", focus);
    return () => document.documentElement.classList.remove("reading-focus");
  }, [focus]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-1.5"
      onClick={() => setFocus((value) => !value)}
      aria-pressed={focus}
    >
      {focus ? (
        <Minimize2 className="size-3.5" />
      ) : (
        <Maximize2 className="size-3.5" />
      )}
      {focus ? "Exit focus" : "Focus"}
    </Button>
  );
}
