import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // pin the workspace root so a stray lockfile in the home dir is ignored
  outputFileTracingRoot: __dirname,
  // the repo lives on the iCloud-synced Desktop; iCloud's sync agent (bird)
  // deletes freshly written build artifacts mid-session. iCloud skips anything
  // named *.nosync, so the build dir hides behind that convention — LOCALLY.
  // On Vercel there is no iCloud, and its @vercel/next builder hard-expects the
  // default ".next" (a custom distDir makes it report "No serverless pages were
  // built"). VERCEL=1 in every Vercel build, so switch back to ".next" there.
  distDir: process.env.VERCEL ? ".next" : ".next.nosync",
};

export default nextConfig;
