import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/tickets', 
  output: 'standalone', 
  
  // 🛡️ CORRECCIÓN: Lo regresamos a 'experimental' para que TypeScript sea feliz
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb', 
      allowedOrigins: ["localhost:4001", "10.1.0.160:4001"] 
    },
  },
};

export default nextConfig;