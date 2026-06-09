import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // pin the workspace root so a stray lockfile in the home dir is ignored
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
