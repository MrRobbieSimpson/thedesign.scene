import Image from "next/image";

import { avatarSrc } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export function Avatar({
  src,
  alt,
  size = 32,
  xHandle,
  className,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  /** Display size in CSS pixels. */
  size?: number;
  /** When set, prefer a high-res X/Unavatar source over Clerk’s tiny OAuth thumb. */
  xHandle?: string | null;
  className?: string;
  priority?: boolean;
}) {
  const resolved = avatarSrc(src, size, { xHandle });
  const initial = alt.replace("@", "").charAt(0).toUpperCase() || "?";

  if (!resolved) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium",
          className
        )}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(10, size * 0.35),
        }}
        aria-hidden={alt ? undefined : true}
      >
        {initial}
      </span>
    );
  }

  // Request a large intrinsic size so Next/Image doesn’t downsample a soft source.
  const intrinsic = Math.min(Math.max(size * 3, 128), 512);

  return (
    <Image
      src={resolved}
      alt={alt}
      width={intrinsic}
      height={intrinsic}
      quality={100}
      priority={priority}
      sizes={`${size}px`}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}
