"use client";

import dynamic from "next/dynamic";

/**
 * Non-critical chrome loaded after hydration so first paint stays lean.
 */
const CursorSpotlight = dynamic(
  () =>
    import("@/components/cursor-spotlight").then((mod) => mod.CursorSpotlight),
  { ssr: false }
);

const WritingStudio = dynamic(
  () =>
    import("@/components/writing/writing-studio").then(
      (mod) => mod.WritingStudio
    ),
  { ssr: false }
);

export function DeferredUi() {
  return (
    <>
      <CursorSpotlight />
      <WritingStudio />
    </>
  );
}
