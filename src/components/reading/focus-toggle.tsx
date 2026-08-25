"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "scene-reading-focus";

/**
 * Toggles a calm focus class on <html> so only the piece remains.
 * Esc exits. While focused, a fixed X stays on screen (toolbar hides).
 */
export function FocusToggle() {
  const [focus, setFocus] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  function exitFocus() {
    setFocus(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5"
        onClick={() => setFocus((value) => !value)}
        aria-pressed={focus}
      >
        <Maximize2 className="size-3.5" />
        Focus
      </Button>

      {mounted && focus
        ? createPortal(
            <button
              type="button"
              onClick={exitFocus}
              aria-label="Exit focus"
              title="Exit focus (Esc)"
              className="fixed top-4 right-4 z-[110] inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-card/90 text-muted-foreground shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:top-5 sm:right-5"
            >
              <X className="size-4" />
            </button>,
            document.body
          )
        : null}
    </>
  );
}
