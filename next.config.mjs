/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Tree-shake Framer Motion so the new animations don't bloat the client bundle.
    optimizePackageImports: ["framer-motion"],
  },
};

export default nextConfig;
