/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['coloring-app-bucket.s3.amazonaws.com', 'localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

module.exports = nextConfig;
