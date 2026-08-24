"use client";

import { useEffect, useState } from "react";

/**
 * Subtle live clock. Uses the signed-in profile timezone when set
 * (resolved from Location); otherwise the browser’s local zone.
 * Hover reveals seconds (ticking live) until unhover.
 */
export function LocalTime({ timeZone }: { timeZone?: string | null }) {
  const [now, setNow] = useState<Date | null>(null);
  const [hovered, setHovered] = useState(false);
  const zoneOption = timeZone?.trim() || undefined;

  useEffect(() => {
    setNow(new Date());

    if (hovered) {
      const id = window.setInterval(() => setNow(new Date()), 1_000);
      return () => window.clearInterval(id);
    }

    const id = window.setInterval(() => setNow(new Date()), 30_000);
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    const align = window.setTimeout(() => {
      setNow(new Date());
    }, msToNextMinute);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(align);
    };
  }, [hovered]);

  if (!now) {
    return (
      <span className="hidden h-8 w-[4.75rem] md:inline-flex" aria-hidden />
    );
  }

  const formatOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    ...(hovered ? { second: "2-digit" as const } : {}),
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
    time = now.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      ...(hovered ? { second: "2-digit" as const } : {}),
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
      onMouseEnter={() => {
        setHovered(true);
        setNow(new Date());
      }}
      onMouseLeave={() => setHovered(false)}
      className="hidden h-8 cursor-default items-center tabular-nums text-[11px] leading-none tracking-wide text-muted-foreground/70 transition-colors hover:text-muted-foreground md:inline-flex"
    >
      {time}
      {zoneLabel ? <span className="ml-1">{zoneLabel}</span> : null}
    </time>
  );
}
