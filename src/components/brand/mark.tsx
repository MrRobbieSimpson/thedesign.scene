import { cn } from "@/lib/utils";

/**
 * sit with design mark — bold geometric ribbon (modern S / sit curve).
 * Solid, clean, favicon-friendly. currentColor for chip inversion.
 */
export function BrandMark({
  className,
  title = "sit with design",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-full", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d="M8.5 8.8c0-3.4 3.2-5.8 7.6-5.8 3.2 0 5.8 1.3 7 3.5.35.65.15 1.45-.5 1.8-.65.35-1.45.15-1.8-.5-.85-1.5-2.7-2.5-4.7-2.5-2.9 0-4.9 1.5-4.9 3.5 0 1.5.95 2.5 3.1 3.25l5.5 1.9c3.4 1.15 5.3 2.95 5.3 5.85 0 3.7-3.3 6.3-8 6.3-3.5 0-6.2-1.4-7.5-3.7-.4-.7-.2-1.55.5-1.95.7-.4 1.55-.2 1.95.5.95 1.6 2.85 2.65 5.05 2.65 3.15 0 5.3-1.7 5.3-3.8 0-1.55-1-2.55-3.4-3.4l-5.45-1.85C10.2 13.1 8.5 11.4 8.5 8.8Z" />
    </svg>
  );
}

/** Filled chip used in the site header / footer. */
export function BrandMarkChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground p-[0.4rem] text-background",
        "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "group-hover:scale-[1.04] group-active:scale-[0.97]",
        className
      )}
    >
      <BrandMark className="size-[1.05rem]" />
    </span>
  );
}
