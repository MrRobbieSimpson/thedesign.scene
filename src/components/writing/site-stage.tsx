"use client";

import { useWriting } from "@/components/writing/writing-context";
import { cn } from "@/lib/utils";

/**
 * Site chrome recedes when writing — dimmed so the editorial column is focus.
 */
export function SiteStage({ children }: { children: React.ReactNode }) {
  const { open, visible } = useWriting();

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        open && visible
          ? "pointer-events-none scale-[0.98] opacity-25 blur-[2px]"
          : "scale-100 opacity-100 blur-0"
      )}
      aria-hidden={open && visible ? true : undefined}
    >
      {children}
    </div>
  );
}
