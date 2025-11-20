/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ⚠️ OJO: Esto deshabilita los errores de ESLint en build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠️ Y esto deshabilita los errores de TypeScript
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/payment/:path*',
        headers: [
          { 
            key: 'X-Frame-Options', 
            value: 'ALLOWALL'
          },
          { 
            key: 'Content-Security-Policy', 
            value: "frame-ancestors *"
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL || 'http://localhost:3000'}/:path*`,
      },
    ]
  }
}

module.exports = nextConfig
