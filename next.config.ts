import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger PDF uploads via API routes
  serverExternalPackages: ['pdf-parse', 'groq-sdk'],
};

export default nextConfig;
