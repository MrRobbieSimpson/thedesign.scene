"use client";

import { useEffect, useState } from "react";

/**
 * Subtle live clock in the user's local timezone.
 */
export function LocalTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    // Align to the next minute boundary for cleaner updates
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    const align = window.setTimeout(() => {
      setNow(new Date());
    }, msToNextMinute);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(align);
    };
  }, []);

  if (!now) {
    return (
      <span
        className="hidden w-[4.5rem] sm:inline-block"
        aria-hidden
      />
    );
  }

  const time = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const zone =
    Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value ?? "";

  return (
    <time
      dateTime={now.toISOString()}
      title={zone ? `Local time (${zone})` : "Local time"}
      className="hidden tabular-nums text-[11px] tracking-wide text-muted-foreground/70 sm:inline"
    >
      {time}
    </time>
  );
}
