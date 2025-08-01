const { i18n } = require('./next-i18next.config')

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'api.learnai.com'],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ]
  }
}

module.exports = nextConfig
