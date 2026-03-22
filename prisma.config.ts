// Prisma 7 config — URL used by CLI tools (db push, studio, generate, etc.)
// In local dev, DATABASE_URL comes from .env. In Vercel, it's injected automatically.
import { defineConfig } from "prisma/config";

// Load .env only in local dev (dotenv is a no-op when vars are already set)
if (process.env.NODE_ENV !== "production") {
  try { require("dotenv").config(); } catch { /* dotenv not installed, skip */ }
}

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
});
