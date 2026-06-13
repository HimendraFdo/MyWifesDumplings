/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Tree-shake Framer Motion so the new animations don't bloat the client bundle.
    optimizePackageImports: ["framer-motion"],
  },
  images: {
    // Sanity-hosted images (menu photos, gallery) are served from this host.
    // next/image blocks remote hostnames unless they're allow-listed here.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
