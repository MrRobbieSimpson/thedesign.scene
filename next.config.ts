import type { NextConfig } from "next";

/**
 * Hosts we ingest product/UI images from.
 * Prefer explicit hostnames; use **.example.com for subdomains (Next.js syntax).
 */
const imageHosts = [
  "img.clerk.com",
  "images.clerk.dev",
  "unavatar.io",
  "pbs.twimg.com",
  "images.unsplash.com",
  "static.dezeen.com",
  "substackcdn.com",
  "substack-post-media.s3.amazonaws.com",
  "cdn.recent.design",
  "recent.design",
  "www.recent.design",
  "spottedinprod.com",
  "www.spottedinprod.com",
  "cdn.spottedinprod.com",
  "**.spottedinprod.com",
  "layers.to",
  "**.layers.to",
  "layers-r2.com",
  "**.layers-r2.com",
  "layers-uploads-prod.s3.eu-west-2.amazonaws.com",
  "layers-uploads-prod.s3.amazonaws.com",
  "cdn.dribbble.com",
  "**.dribbble.com",
  "mir-s3-cdn-cf.behance.net",
  "**.behance.net",
  "assets.awwwards.com",
  "**.awwwards.com",
  "siteinspire.com",
  "www.siteinspire.com",
  "**.siteinspire.com",
  "miro.medium.com",
  "**.medium.com",
  "cdn.smashingmagazine.com",
  "httpster.net",
  "www.httpster.net",
  "onepagelove.com",
  "www.onepagelove.com",
  "assets.onepagelove.com",
  "saaslandingpage.com",
  "www.saaslandingpage.com",
] as const;

const nextConfig: NextConfig = {
  // Tree-shake icon / SDK imports for smaller client bundles.
  experimental: {
    optimizePackageImports: ["lucide-react", "@clerk/nextjs", "date-fns"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      ...imageHosts.map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
      {
        protocol: "https" as const,
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https" as const,
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
