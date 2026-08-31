import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake icon / SDK imports for smaller client bundles.
  experimental: {
    optimizePackageImports: ["lucide-react", "@clerk/nextjs", "date-fns"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "unavatar.io" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "static.dezeen.com" },
      { protocol: "https", hostname: "substackcdn.com" },
      { protocol: "https", hostname: "substack-post-media.s3.amazonaws.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "cdn.recent.design" },
      { protocol: "https", hostname: "recent.design" },
      { protocol: "https", hostname: "www.recent.design" },
      { protocol: "https", hostname: "spottedinprod.com" },
      { protocol: "https", hostname: "www.spottedinprod.com" },
      { protocol: "https", hostname: "cdn.spottedinprod.com" },
      { protocol: "https", hostname: "layers.to" },
      { protocol: "https", hostname: "*.layers.to" },
      { protocol: "https", hostname: "layers-r2.com" },
      { protocol: "https", hostname: "*.layers-r2.com" },
      {
        protocol: "https",
        hostname: "layers-uploads-prod.s3.eu-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "layers-uploads-prod.s3.amazonaws.com",
      },
      { protocol: "https", hostname: "cdn.dribbble.com" },
      { protocol: "https", hostname: "*.dribbble.com" },
      { protocol: "https", hostname: "mir-s3-cdn-cf.behance.net" },
      { protocol: "https", hostname: "*.behance.net" },
      { protocol: "https", hostname: "assets.awwwards.com" },
      { protocol: "https", hostname: "*.awwwards.com" },
      { protocol: "https", hostname: "siteinspire.com" },
      { protocol: "https", hostname: "*.siteinspire.com" },
      { protocol: "https", hostname: "cdn.spottedinprod.com" },
      { protocol: "https", hostname: "*.spottedinprod.com" },
      { protocol: "https", hostname: "miro.medium.com" },
      { protocol: "https", hostname: "*.medium.com" },
      { protocol: "https", hostname: "cdn.smashingmagazine.com" },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
