/**
 * Pass-through — a keyed remount + 400ms enter animation was making every
 * Feed ↔ Events ↔ Jobs click feel like a full reload. Instant paint wins.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return children;
}
