"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Soft scroll progress + remaining sit-with time.
 * After a quiet dwell, a very light “you’ve been here a while” line.
 */
export function ReadingProgress({
  targetId,
  readingTimeMinutes,
}: {
  targetId: string;
  readingTimeMinutes?: number | null;
}) {
  const [progress, setProgress] = useState(0);
  const [dwellSeconds, setDwellSeconds] = useState(0);

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

  useEffect(() => {
    const started = Date.now();
    const tick = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setDwellSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [targetId]);

  const totalMins =
    readingTimeMinutes && readingTimeMinutes >= 1 ? readingTimeMinutes : null;
  const remainingMins =
    totalMins != null && progress > 0.04 && progress < 0.97
      ? Math.max(1, Math.ceil((1 - progress) * totalMins))
      : null;

  // Very light — only after ~2 minutes, and not near the end.
  const showLinger = dwellSeconds >= 120 && progress < 0.85;

  const statusParts: string[] = [];
  if (remainingMins != null) {
    statusParts.push(
      remainingMins === 1 ? "~1 min left" : `~${remainingMins} min left`
    );
  }
  if (showLinger) {
    statusParts.push("you’ve been here a while");
  }

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-0.5 bg-transparent"
        aria-hidden
      >
        <div
          className="h-full origin-left bg-foreground/35 transition-[width] duration-150 ease-out motion-reduce:transition-none"
          style={{ width: `${Math.round(progress * 1000) / 10}%` }}
        />
      </div>

      {statusParts.length > 0 ? (
        <p
          className={cn(
            "pointer-events-none fixed top-3 right-4 z-[90] max-w-[14rem] text-right",
            "text-[11px] tracking-wide text-muted-foreground/70",
            "transition-opacity duration-700 ease-out",
            "sm:right-6"
          )}
          aria-live="polite"
        >
          {statusParts.join(" · ")}
        </p>
      ) : null}
    </>
  );
}
