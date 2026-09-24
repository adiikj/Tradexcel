/** @type {import('next').Config} */
const nextConfig = {
  reactStrictMode: true,
  // Lets a verification build run beside `next dev` without sharing .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    // Hosts whose images get optimized; keep in sync with OPTIMIZED_HOSTS in
    // src/components/ui/RemoteImage.tsx (anything else is served as-is).
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" }, // avatars, contest images
      { protocol: "https", hostname: "*.googleusercontent.com" }, // Google sign-in avatars
      { protocol: "https", hostname: "s.yimg.com" }, // news thumbnails
    ],
  },
  turbopack: {
    root: import.meta.dirname,
  },
  webpack: (config) => {
    // @tradexcel/shared is compiled from its TypeScript source (tsconfig paths),
    // which uses Node ESM-style imports ending in ".js"; resolve those to .ts.
    config.resolve.extensionAlias = { ...config.resolve.extensionAlias, ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
};

export default nextConfig;
