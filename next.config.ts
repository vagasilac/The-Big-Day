
import type {NextConfig} from 'next';

const nextConfigBase: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // The optimizer rejects some Unsplash responses in dev ("upstream response is invalid").
    // Serving the original URLs keeps gallery photos working without the image proxy.
    unoptimized: true,
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
  webpack: config => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
  turbopack: {
    resolveAlias: {
      canvas: './empty.js',
    },
  },
};

export default nextConfigBase;
