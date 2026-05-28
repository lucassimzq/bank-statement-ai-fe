/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      // Encore local dev object storage (localhost or 127.0.0.1)
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      // AWS S3 (production)
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      // GCS (production)
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
}

export default nextConfig
