"use client";

import { useEffect, useState } from "react";

/**
 * Extremely soft radial highlight that follows the pointer.
 * Disabled when the user prefers reduced motion or has no fine pointer.
 */
export function CursorSpotlight() {
  const [enabled, setEnabled] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: fine)");

    const sync = () => {
      setEnabled(!motion.matches && pointer.matches);
    };

    sync();
    motion.addEventListener("change", sync);
    pointer.addEventListener("change", sync);

    return () => {
      motion.removeEventListener("change", sync);
      pointer.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: PointerEvent) => {
      setPos({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 mix-blend-soft-light transition-opacity duration-700"
      style={{
        background: `radial-gradient(
          420px circle at ${pos.x}px ${pos.y}px,
          color-mix(in oklch, var(--foreground) 4.5%, transparent),
          transparent 55%
        )`,
      }}
    />
  );
}
