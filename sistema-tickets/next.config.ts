import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/tickets', // <-- ESTA ES LA MAGIA PARA EL PREFIJO
  output: 'standalone', // <-- Súper optimización para Docker
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;