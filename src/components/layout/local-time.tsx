"use client";

import { useEffect, useState } from "react";

/**
 * Subtle live clock. Uses the signed-in profile timezone when set
 * (resolved from Location); otherwise the browser’s local zone.
 */
export function LocalTime({ timeZone }: { timeZone?: string | null }) {
  const [now, setNow] = useState<Date | null>(null);
  const zoneOption = timeZone?.trim() || undefined;

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
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
      <span className="hidden h-8 w-[4.75rem] md:inline-flex" aria-hidden />
    );
  }

  const formatOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    ...(zoneOption ? { timeZone: zoneOption } : {}),
  };

  let time: string;
  let zoneLabel = "";
  try {
    time = now.toLocaleTimeString(undefined, formatOpts);
    zoneLabel =
      Intl.DateTimeFormat(undefined, {
        timeZoneName: "short",
        ...(zoneOption ? { timeZone: zoneOption } : {}),
      })
        .formatToParts(now)
        .find((part) => part.type === "timeZoneName")?.value ?? "";
  } catch {
    // Invalid stored zone — fall back to device local.
    time = now.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    zoneLabel =
      Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
        .formatToParts(now)
        .find((part) => part.type === "timeZoneName")?.value ?? "";
  }

  const title = zoneOption
    ? `Time in ${zoneOption}${zoneLabel ? ` (${zoneLabel})` : ""}`
    : zoneLabel
      ? `Local time (${zoneLabel})`
      : "Local time";

  return (
    <time
      dateTime={now.toISOString()}
      title={title}
      className="hidden h-8 items-center tabular-nums text-[11px] leading-none tracking-wide text-muted-foreground/70 md:inline-flex"
    >
      {time}
      {zoneLabel ? <span className="ml-1">{zoneLabel}</span> : null}
    </time>
  );
}
