import type { NextConfig } from "next";

// Static export (./out) is used by BOTH the desktop (Electron) build and the
// Firebase Hosting (static CDN) deploy. A plain `next build` stays a normal
// server build (e.g. for Firebase App Hosting). Gate the export behind
// BUILD_TARGET=desktop or STATIC_EXPORT=true (set by the build:web/deploy scripts).
const staticExport =
  process.env.BUILD_TARGET === "desktop" || process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = staticExport
  ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
  : {};

export default nextConfig;
