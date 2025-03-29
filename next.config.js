/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  env: {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    VERCEL_TOKEN: process.env.VERCEL_TOKEN
  },
  webpack: (config) => {
    config.infrastructureLogging = { level: 'none' };
    config.stats = 'errors-only';
    
    config.resolve.alias = {
      '@': path.resolve(__dirname, 'src'),
      '@landing-pages': path.resolve(__dirname, 'landing-pages')
    };
    
    return config;
  },
  experimental: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
