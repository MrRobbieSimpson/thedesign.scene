import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Editorial empty state — short line + one clear action.
 */
export function EmptyState({
  eyebrow,
  title,
  description,
  action,
  className,
  size = "lg",
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border/80 px-6 text-center",
        size === "lg" ? "py-20 sm:py-24" : "py-14 sm:py-16",
        className
      )}
    >
      {eyebrow ? (
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      ) : null}
      <p
        className={cn(
          "font-heading tracking-tight text-balance",
          size === "lg" ? "text-2xl sm:text-3xl" : "text-xl",
          eyebrow && "mt-3"
        )}
      >
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
        {description}
      </p>
      {action ? (
        <div className="mt-6 flex justify-center">{action}</div>
      ) : null}
    </div>
  );
}
