/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://192.168.140.149:5004/api/:path*',
      },
      {
        source: '/graphql',
        destination: 'http://192.168.140.149:5004/graphql',
      },
    ];
  },
};

module.exports = nextConfig;
