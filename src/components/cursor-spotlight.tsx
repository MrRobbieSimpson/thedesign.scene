"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Soft radial highlight that follows the pointer.
 * Updates the DOM directly (no React re-renders on mousemove).
 */
export function CursorSpotlight() {
  const layerRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

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
    const layer = layerRef.current;
    if (!layer) return;

    let frame = 0;
    let nextX = -9999;
    let nextY = -9999;

    const paint = () => {
      frame = 0;
      layer.style.background = `radial-gradient(
        560px circle at ${nextX}px ${nextY}px,
        color-mix(in oklch, var(--foreground) 11%, transparent),
        color-mix(in oklch, var(--foreground) 3.5%, transparent) 35%,
        transparent 65%
      )`;
    };

    const onMove = (event: PointerEvent) => {
      nextX = event.clientX;
      nextY = event.clientY;
      if (frame) return;
      frame = window.requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={layerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60]"
    />
  );
}
