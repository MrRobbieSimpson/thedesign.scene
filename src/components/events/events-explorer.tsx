"use client";

import { useMemo, useState, useTransition } from "react";
import { MapPin, Navigation } from "lucide-react";

import { EventCard } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";
import type { Event } from "@/db/schema";
import { distanceKm, formatDistanceKm, type Coordinates } from "@/lib/geo";
import { cn } from "@/lib/utils";

type SerializedEvent = Omit<Event, "startDate" | "endDate" | "createdAt" | "updatedAt"> & {
  startDate: string | Date;
  endDate: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type EventsExplorerProps = {
  events: SerializedEvent[];
};

type LocatedEvent = Event & { distanceKm: number | null };

function reviveEvent(event: SerializedEvent): Event {
  return {
    ...event,
    startDate: new Date(event.startDate),
    endDate: event.endDate ? new Date(event.endDate) : null,
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt),
  };
}

export function EventsExplorer({ events }: EventsExplorerProps) {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [nearMe, setNearMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const revived = useMemo(() => events.map(reviveEvent), [events]);

  const located = useMemo<LocatedEvent[]>(() => {
    const withDistance = revived.map((event) => {
      if (
        !userLocation ||
        event.latitude == null ||
        event.longitude == null
      ) {
        return { ...event, distanceKm: null };
      }
      return {
        ...event,
        distanceKm: distanceKm(userLocation, {
          latitude: event.latitude,
          longitude: event.longitude,
        }),
      };
    });

    if (!nearMe || !userLocation) {
      return withDistance.sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );
    }

    return withDistance.sort((a, b) => {
      // Geocoded events first, nearest first; remote / unknown after
      if (a.distanceKm == null && b.distanceKm == null) {
        return a.startDate.getTime() - b.startDate.getTime();
      }
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [revived, nearMe, userLocation]);

  function enableNearMe() {
    setError(null);

    if (!navigator.geolocation) {
      setError("Location isn’t available in this browser.");
      return;
    }

    startTransition(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setNearMe(true);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setError("Location permission denied. You can enable it in browser settings.");
          } else {
            setError("Couldn’t get your location. Try again in a moment.");
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 }
      );
    });
  }

  function clearNearMe() {
    setNearMe(false);
    setError(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {!nearMe ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={enableNearMe}
              disabled={pending}
              className="gap-1.5"
            >
              <Navigation className="size-3.5" />
              {pending ? "Locating…" : "Find near me"}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={clearNearMe}
                className="gap-1.5"
              >
                <MapPin className="size-3.5" />
                Near me
              </Button>
              <button
                type="button"
                onClick={clearNearMe}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Show all by date
              </button>
            </>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {nearMe
            ? "Sorted by distance from you"
            : `${events.length} upcoming · sorted by date`}
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {error}
        </p>
      ) : null}

      {located.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 px-6 py-20 text-center">
          <p className="font-heading text-2xl tracking-tight">No events yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Published events will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {located.map((event) => (
            <div key={event.id} className="relative">
              {nearMe && event.distanceKm != null ? (
                <span
                  className={cn(
                    "absolute top-4 right-4 z-10 rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-md"
                  )}
                >
                  {formatDistanceKm(event.distanceKm)}
                </span>
              ) : null}
              {nearMe && event.distanceKm == null ? (
                <span className="absolute top-4 right-4 z-10 rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-md">
                  {event.type === "remote" ? "Remote" : "No map pin"}
                </span>
              ) : null}
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
