import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Allow larger PDF uploads via API routes
  serverExternalPackages: ['pdf-parse', 'groq-sdk'],
  // Monorepo: pin workspace root so Next doesn't pick a parent lockfile.
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
