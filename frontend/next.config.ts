import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/spotify/:path*',
        destination: 'http://localhost:5000/api/spotify/:path*', // proxy to Express
      },
    ];
  },
};

export default nextConfig;

