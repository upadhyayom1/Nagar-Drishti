import type { NextConfig } from "next";

// Browser requests stay on the frontend origin. This keeps the auth cookie
// first-party in both local development and the Vercel deployment.
const backendApiUrl = (process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/+$/, '');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
