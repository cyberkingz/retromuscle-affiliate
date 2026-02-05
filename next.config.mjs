/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "retromuscle.net"
      }
    ]
  },
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
