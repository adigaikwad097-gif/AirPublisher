/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone for server deployment, not Vercel
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  images: {
    domains: ['localhost', '93.127.216.83'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'www.dropbox.com',
      },
      {
        protocol: 'https',
        hostname: '**.dropbox.com',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'http',
        hostname: '93.127.216.83',
      },
    ],
  },
  // Note: Vercel has a 4.5MB limit for serverless functions by default
  // For larger uploads, we proxy through to n8n which handles the file
}

module.exports = nextConfig

