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

const required = [
  "GITHUB_APP_ID",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_PRIVATE_KEY_PEM",
  "GITHUB_APP_SLUG",
];

const missing = required.filter((key) => !(process.env[key] ?? "").trim());

if (process.env.STORAGE_MODE !== "db") {
  console.log("github-smoke: SKIP (STORAGE_MODE != db)");
  process.exit(0);
}

if (missing.length) {
  console.log(`github-smoke: SKIP (missing env: ${missing.join(", ")})`);
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.log("github-smoke: SKIP (DATABASE_URL missing)");
  process.exit(0);
}

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { SignJWT, importPKCS8 } = require("jose");

const normalizePem = (value) =>
  value.replace(/\\n/g, "\n").replace(/^"|"$/g, "");

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const installation = await prisma.gitHubInstallation.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!installation) {
      console.log("github-smoke: SKIP (no installation)");
      return;
    }

    const appId = process.env.GITHUB_APP_ID;
    const privateKey = await importPKCS8(normalizePem(process.env.GITHUB_PRIVATE_KEY_PEM), "RS256");
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256" })
      .setIssuedAt()
      .setExpirationTime("10m")
      .setIssuer(appId)
      .sign(privateKey);

    const res = await fetch(
      `https://api.github.com/app/installations/${installation.installationId}/access_tokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "Ledger",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`github-smoke: FAILED (${res.status}) ${text}`);
      process.exitCode = 1;
      return;
    }

    const data = await res.json();
    if (!data.token) {
      console.error("github-smoke: FAILED (missing token)");
      process.exitCode = 1;
      return;
    }

    console.log("github-smoke: OK");
  } catch (error) {
    console.error("github-smoke: FAILED", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
})();
