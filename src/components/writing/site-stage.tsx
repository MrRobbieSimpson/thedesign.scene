"use client";

import { useWriting } from "@/components/writing/writing-context";
import { cn } from "@/lib/utils";

/**
 * Wraps the main site chrome so it can recede when the writing studio opens.
 */
export function SiteStage({ children }: { children: React.ReactNode }) {
  const { open, visible } = useWriting();

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        open && visible
          ? "scale-[0.985] opacity-40 blur-[1.5px]"
          : "scale-100 opacity-100 blur-0"
      )}
      aria-hidden={open && visible ? true : undefined}
    >
      {children}
    </div>
  );
}
