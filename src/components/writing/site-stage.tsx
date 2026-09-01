"use client";

import { useWriting } from "@/components/writing/writing-context";
import { cn } from "@/lib/utils";

/**
 * Site chrome recedes when writing — dimmed so the editorial column is focus.
 * Idle state must NOT use transform (even scale-100) — that traps position:fixed
 * and pinned the mobile bottom nav to the document end instead of the viewport.
 */
export function SiteStage({ children }: { children: React.ReactNode }) {
  const { open, visible } = useWriting();
  const recessed = open && visible;

  return (
    <div
      className={cn(
        "flex min-h-dvh w-full max-w-full min-w-0 flex-col overflow-x-clip",
        "transition-[opacity,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        recessed
          ? "pointer-events-none scale-[0.98] opacity-25 blur-[2px] transition-all"
          : "opacity-100 blur-0"
      )}
      aria-hidden={recessed ? true : undefined}
    >
      {children}
    </div>
  );
}
