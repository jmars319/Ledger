import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "..");
const riskyLockfile = path.resolve(repoRoot, "..", "..", "..", "package-lock.json");

if (fs.existsSync(riskyLockfile)) {
  console.error("\nTurbopack guard: Found a parent package-lock.json at:");
  console.error(`  ${riskyLockfile}`);
  console.error("This can cause Turbopack to resolve the wrong workspace root and break module resolution.");
  console.error("Remove or move that lockfile before using Turbopack, or stick with webpack dev mode.\n");
  process.exit(1);
}

console.log("Turbopack guard: OK.");
