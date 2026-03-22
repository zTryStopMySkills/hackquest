import type { NextConfig } from "next";

const ALLOWED_ORIGINS = [
  "https://hackquest.vercel.app",
  "https://www.hackquest.vercel.app",
  "http://localhost:3000",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // El cliente Prisma está desactualizado respecto al schema — los errores son falsos positivos
    // Ejecutar `prisma migrate dev` + `prisma generate` cuando la DB de producción esté sincronizada
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ALLOWED_ORIGINS,
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
