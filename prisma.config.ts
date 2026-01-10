import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { defineConfig } from "prisma/config";

const envPath = ".env";
const envLocalPath = ".env.local";

if (existsSync(envPath)) {
  loadEnv({ path: envPath });
}
if (existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath, override: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
