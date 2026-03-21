// Prisma 7 configuration file.
// Connection URL is read from the DATABASE_URL environment variable.
// Set this variable in .env (local) or in your deployment secrets.
//
// Example DATABASE_URL:
//   postgresql://user:password@localhost:5432/hackquest?schema=public

import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
});
