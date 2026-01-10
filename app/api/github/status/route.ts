import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { hasGitHubEnv, missingGitHubEnv } from "@/lib/github/env";

export async function GET() {
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ connected: false, reason: "storage_mode" });
  }

  if (!hasGitHubEnv()) {
    return NextResponse.json({
      connected: false,
      reason: "missing_env",
      missing: missingGitHubEnv(),
    });
  }

  const prisma = getPrismaClient();
  const installation = await prisma.gitHubInstallation.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!installation) {
    return NextResponse.json({ connected: false, reason: "not_installed" });
  }

  const [repoCount, selectedCount] = await prisma.$transaction([
    prisma.gitHubRepo.count({ where: { installationId: installation.id } }),
    prisma.gitHubRepo.count({ where: { installationId: installation.id, selected: true } }),
  ]);

  return NextResponse.json({
    connected: true,
    installationId: installation.installationId,
    accountLogin: installation.accountLogin,
    accountType: installation.accountType,
    repoCount,
    selectedCount,
  });
}
