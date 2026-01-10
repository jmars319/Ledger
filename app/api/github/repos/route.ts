import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { hasGitHubEnv } from "@/lib/github/env";

export async function GET() {
  if (process.env.STORAGE_MODE !== "db" || !hasGitHubEnv()) {
    return NextResponse.json({ repos: [], connected: false });
  }

  const prisma = getPrismaClient();
  const installation = await prisma.gitHubInstallation.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!installation) {
    return NextResponse.json({ repos: [], connected: false });
  }

  const repos = await prisma.gitHubRepo.findMany({
    where: { installationId: installation.id },
    orderBy: { repoId: "desc" },
  });

  return NextResponse.json({ connected: true, repos });
}
