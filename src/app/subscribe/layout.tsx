import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Digest",
  path: "/subscribe",
  description:
    "A short Thursday note from sit with design — editor’s picks, new writing, and events. No account required.",
});

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
