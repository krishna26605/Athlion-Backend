/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['jsonwebtoken', 'semver', 'mongoose', 'bcryptjs', 'razorpay', 'twilio', 'mongodb'],
  async rewrites() {
    return [
      { source: '/auth/:path*', destination: '/api/auth/:path*' },
      { source: '/events/:path*', destination: '/api/events/:path*' },
      { source: '/registrations/:path*', destination: '/api/registrations/:path*' },
      { source: '/admin/:path*', destination: '/api/admin/:path*' },
      { source: '/sponsors/:path*', destination: '/api/sponsors/:path*' },
      { source: '/checkin/:path*', destination: '/api/checkin/:path*' },
      { source: '/ai/:path*', destination: '/api/ai/:path*' },
      { source: '/analytics/:path*', destination: '/api/analytics/:path*' },
      { source: '/early-access/:path*', destination: '/api/early-access/:path*' },
      { source: '/blogs/:path*', destination: '/api/blogs/:path*' },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
