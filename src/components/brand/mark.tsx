import { cn } from "@/lib/utils";

/**
 * sit with design mark — folded broadsheet + quiet serif masthead “S”.
 * Uses currentColor so it inverts cleanly in the header chip.
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
      {/* Paper body */}
      <path
        d="M7.5 6.5h13.2c.4 0 .8.16 1.08.44L25.5 10.7c.28.28.44.66.44 1.06V24.5c0 .83-.67 1.5-1.5 1.5h-15c-.83 0-1.5-.67-1.5-1.5v-16c0-.83.67-1.5 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Folded corner */}
      <path
        d="M20.7 6.5v3.4c0 .55.45 1 1 1h3.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.7 6.5 25.1 10.9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Masthead rule */}
      <path
        d="M10 14.2h12"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.95"
      />
      {/* Serif S — condensed masthead letter */}
      <path
        d="M17.85 11.15c-.55-.42-1.28-.62-2.05-.55-1.22.1-2.05.72-2.05 1.55 0 .78.62 1.22 1.85 1.48l.55.12c1.35.28 2.05.72 2.05 1.62 0 .95-.92 1.58-2.28 1.58-1.05 0-1.95-.35-2.55-.95"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Column rules */}
      <path
        d="M15.75 16.6v7.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.35"
      />
      {/* Text lines — left column */}
      <path
        d="M10 17.6h4.2M10 19.35h4.2M10 21.1h3.4M10 22.85h3.8"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Text lines — right column */}
      <path
        d="M17.4 17.6h4.6M17.4 19.35h4.6M17.4 21.1h3.8M17.4 22.85h4.2"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

/** Filled chip used in the site header. */
export function BrandMarkChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground p-1 text-background",
        "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "group-hover:scale-[1.04] group-active:scale-[0.97]",
        className
      )}
    >
      <BrandMark className="size-[1.15rem]" />
    </span>
  );
}
