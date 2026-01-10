import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { hasGitHubEnv } from "@/lib/github/env";
import { syncInstallationRepos } from "@/lib/github/sync";

export async function POST() {
  if (process.env.STORAGE_MODE !== "db" || !hasGitHubEnv()) {
    return NextResponse.json({ error: "GitHub not configured." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const installation = await prisma.gitHubInstallation.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!installation) {
    return NextResponse.json({ error: "No installation." }, { status: 404 });
  }

  const count = await syncInstallationRepos(
    prisma,
    installation.id,
    installation.installationId
  );

  return NextResponse.json({ synced: count });
}
