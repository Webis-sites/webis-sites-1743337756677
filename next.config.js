/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  webpack: (config) => {
    config.infrastructureLogging = { level: 'none' };
    config.stats = 'errors-only';
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tmp': path.join(process.cwd(), 'tmp'),
      '@versions': path.join(process.cwd(), 'tmp/versions'),
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
