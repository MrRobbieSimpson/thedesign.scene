"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const THEME_TRANSITION_MS = 450;

function runWithThemeTransition(update: () => void) {
  if (typeof document === "undefined") {
    update();
    return;
  }

  const root = document.documentElement;
  root.classList.add("theme-transition");

  const finish = () => {
    window.setTimeout(() => {
      root.classList.remove("theme-transition");
    }, THEME_TRANSITION_MS);
  };

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };

  if (typeof doc.startViewTransition === "function") {
    const transition = doc.startViewTransition(() => {
      update();
    });
    void transition.finished.finally(finish);
    return;
  }

  update();
  finish();
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon-sm" aria-label="Toggle theme" disabled>
        <Sun className="size-4 opacity-0" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() =>
        runWithThemeTransition(() => setTheme(isDark ? "light" : "dark"))
      }
    >
      <span className="relative flex size-4 items-center justify-center">
        <Sun
          className={`absolute size-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isDark
              ? "scale-100 rotate-0 opacity-100"
              : "scale-50 -rotate-90 opacity-0"
          }`}
        />
        <Moon
          className={`absolute size-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isDark
              ? "scale-50 rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100"
          }`}
        />
      </span>
    </Button>
  );
}
