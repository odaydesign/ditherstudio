import type { NextConfig } from "next";

// Static export (./out) is ONLY for the desktop (Electron) build, which loads the
// app from disk. The web deploy (Firebase App Hosting) must stay a normal Next
// build that runs a server, so gate the export config behind BUILD_TARGET=desktop
// (set by the `build:desktop` script). A plain `next build` => normal server app.
const isDesktop = process.env.BUILD_TARGET === "desktop";

const nextConfig: NextConfig = isDesktop
  ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
  : {};

export default nextConfig;
