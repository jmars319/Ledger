import { config } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log("content:smoke: SKIP (STORAGE_MODE!=db)");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.log("content:smoke: SKIP (DATABASE_URL missing)");
  process.exit(0);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
const adminToken = process.env.ADMIN_TOKEN || "";
const aiConfigured = Boolean(process.env.OPENAI_API_KEY);

try {
  if (!adminToken) {
    console.log("content:smoke: SKIP (ADMIN_TOKEN missing for API checks)");
  } else {
    try {
      const ping = await fetch(baseUrl, { method: "GET" });
      if (!ping.ok) {
        console.log("content:smoke: SKIP (APP_BASE_URL not reachable)");
        process.exit(0);
      }
    } catch {
      console.log("content:smoke: SKIP (APP_BASE_URL not reachable)");
      process.exit(0);
    }

    const createRes = await fetch(`${baseUrl}/api/content/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify({
        type: "FIELD_NOTE",
        status: "DRAFT",
        title: "Smoke check",
        rawInput: "One sentence without bullets.",
        topics: "smoke",
      }),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.ok) {
      throw new Error("content:smoke: create draft failed");
    }

    const itemId = createData.item.id;

    const promoteRes = await fetch(`${baseUrl}/api/content/items/${itemId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify({ status: "READY" }),
    });

    if (promoteRes.ok) {
      console.error("content:smoke: FAILED (promotion should not auto-pass)");
      process.exitCode = 1;
    }

    await prisma.contentItem.update({
      where: { id: itemId },
      data: {
        body: "- One\n- Two\n- Three",
        rawInput: "- One\n- Two\n- Three",
        structured: { bullets: ["One", "Two", "Three"] },
      },
    });

    const promoteRes2 = await fetch(`${baseUrl}/api/content/items/${itemId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify({ status: "READY" }),
    });

    if (!promoteRes2.ok) {
      throw new Error("content:smoke: promotion failed after normalization");
    }

    if (aiConfigured) {
      let serverAiConfigured = false;
      try {
        const aiStatusRes = await fetch(`${baseUrl}/api/ai/status`, {
          method: "GET",
          headers: { "x-admin-token": adminToken },
        });
        const aiStatus = await aiStatusRes.json();
        serverAiConfigured = Boolean(aiStatus?.configured);
      } catch {
        console.log("content:smoke: SKIP (AI status check failed)");
        await prisma.contentItem.delete({ where: { id: itemId } });
        process.exit(0);
      }

      if (!serverAiConfigured) {
        console.log("content:smoke: SKIP (AI not configured on server)");
        await prisma.contentItem.delete({ where: { id: itemId } });
        console.log("content:smoke: OK");
        process.exit(0);
      }

      const aiRes = await fetch(`${baseUrl}/api/ai/content/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          type: "FIELD_NOTE",
          stylePresetId: "neutral-brief",
          rawText: "Shipped: Added Content Ops AI draft workflow.\nImproved: Stronger approval gates.",
        }),
      });

      const aiData = await aiRes.json();
      if (!aiRes.ok || !aiData.ok) {
        const detail = aiData?.error || aiData?.validation?.errors?.[0]?.message || "Unknown error";
        throw new Error(`content:smoke: AI draft generation failed (${detail})`);
      }

      if (aiData.item?.id) {
        await prisma.contentItem.delete({ where: { id: aiData.item.id } });
      }
    } else {
      console.log("content:smoke: SKIP (OPENAI_API_KEY missing for AI draft)");
    }

    await prisma.contentItem.delete({ where: { id: itemId } });
    console.log("content:smoke: OK");
  }
} catch (err) {
  console.error("content:smoke: FAILED", err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
  await pool.end();
}
