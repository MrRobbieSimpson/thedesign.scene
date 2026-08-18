"use client";

import { usePathname } from "next/navigation";

/**
 * Remounts on navigation so each page gets a calm enter animation
 * without remounting the shared header/footer chrome.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
