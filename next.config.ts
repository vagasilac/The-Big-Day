
import type {NextConfig} from 'next';
import nextIntl from 'next-intl/plugin'; // Import the plugin

const nextConfigBase: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

// Tell the plugin where your i18n config lives
// For App Router, this is typically './src/i18n.ts'
const withNextIntl = nextIntl('./src/i18n.ts');

export default withNextIntl(nextConfigBase);
