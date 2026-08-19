"use client";

import { useEffect, useState } from "react";

/**
 * Thin, quiet scroll progress for the article — no percentage label.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const el = document.getElementById(targetId);
      if (!el) {
        setProgress(0);
        return;
      }
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) {
        setProgress(rect.bottom <= window.innerHeight ? 1 : 0);
        return;
      }
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(scrolled / total);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [targetId]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-0.5 bg-transparent"
      aria-hidden
    >
      <div
        className="h-full origin-left bg-foreground/35 transition-[width] duration-150 ease-out motion-reduce:transition-none"
        style={{ width: `${Math.round(progress * 1000) / 10}%` }}
      />
    </div>
  );
}
