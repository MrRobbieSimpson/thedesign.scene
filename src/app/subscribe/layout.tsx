import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Digest",
  path: "/subscribe",
  description:
    "A short Thursday note from thedesign.scene — editor’s picks, new writing, and events near you.",
});

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
