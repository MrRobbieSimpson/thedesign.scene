"use client";

import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "scene-reading-focus";

/**
 * Toggles a calm focus class on <html> so only the piece remains.
 * Esc exits. Session preference is remembered for the tab.
 */
export function FocusToggle() {
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setFocus(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("reading-focus", focus);
    try {
      if (focus) sessionStorage.setItem(STORAGE_KEY, "1");
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return () => document.documentElement.classList.remove("reading-focus");
  }, [focus]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setFocus((value) => {
        if (!value) return value;
        event.preventDefault();
        return false;
      });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
