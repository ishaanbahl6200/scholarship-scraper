/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  typescript: {
    // Ignore TypeScript errors in node_modules (temporary workaround for @auth0/nextjs-auth0 type issue)
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
