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
  // named *.nosync, so the build dir hides behind that convention.
  distDir: ".next.nosync",
};

export default nextConfig;
