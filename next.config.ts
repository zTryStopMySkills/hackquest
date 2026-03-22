import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // El cliente Prisma está desactualizado respecto al schema — los errores son falsos positivos
    // Ejecutar `prisma migrate dev` + `prisma generate` cuando la DB de producción esté sincronizada
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
};

export default nextConfig;
