const { config } = require("dotenv");
const { existsSync } = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const envPath = path.join(repoRoot, ".env");
const envLocalPath = path.join(repoRoot, ".env.local");

if (existsSync(envPath)) {
  config({ path: envPath });
}
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
}

if (process.env.STORAGE_MODE !== "db") {
  console.error("db-smoke: STORAGE_MODE=db is required for this check.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("db-smoke: DATABASE_URL is required for this check.");
  process.exit(1);
}

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await client.$queryRaw`SELECT 1`;
    console.log("db-smoke: OK");
  } catch (error) {
    console.error("db-smoke: FAILED", error);
    process.exitCode = 1;
  } finally {
    await client.$disconnect();
    await pool.end();
  }
})();
