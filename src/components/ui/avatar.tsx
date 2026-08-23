import Image from "next/image";

import { avatarSrc } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export function Avatar({
  src,
  alt,
  size = 32,
  className,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  /** Display size in CSS pixels. */
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const resolved = avatarSrc(src, size);
  const initial = alt.replace("@", "").charAt(0).toUpperCase() || "?";

  if (!resolved) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium",
          className
        )}
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.35) }}
        aria-hidden={alt ? undefined : true}
      >
        {initial}
      </span>
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={size * 2}
      height={size * 2}
      quality={92}
      priority={priority}
      sizes={`${size}px`}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}
