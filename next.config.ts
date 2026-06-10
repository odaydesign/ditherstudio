import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export so the desktop (Electron) shell can load the app from disk
  // with no Node server. The app is 100% client-side (no API routes / server
  // actions), so this is a clean fit. `next dev` is unaffected.
  output: "export",
  // Emit every route as <route>/index.html — simplest to serve offline via the
  // Electron custom protocol (path -> file mapping is unambiguous).
  trailingSlash: true,
  // Required by static export whenever next/image is used (harmless otherwise).
  images: { unoptimized: true },
};

export default nextConfig;
