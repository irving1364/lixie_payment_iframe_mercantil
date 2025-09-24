/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/payment/:path*',
        headers: [
          // IMPORTANTE: Para seguridad en producción, considera restringir dominios específicos
          // o usar un sistema de whitelist dinámico basado en tu base de datos
          { 
            key: 'X-Frame-Options', 
            value: 'ALLOWALL' // Permite embedding desde cualquier origen
          },
          { 
            key: 'Content-Security-Policy', 
            value: "frame-ancestors *" // Permite cualquier origen como ancestro
          },
          // Headers de seguridad adicionales
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ],
      },
    ]
  },
  // Configuración para evitar problemas de mixed content
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