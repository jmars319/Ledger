import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { hasGitHubEnv } from "@/lib/github/env";

export async function POST() {
  if (process.env.STORAGE_MODE !== "db" || !hasGitHubEnv()) {
    return NextResponse.json({ error: "GitHub not configured." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const installation = await prisma.gitHubInstallation.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!installation) {
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction([
    prisma.gitHubRepo.deleteMany({ where: { installationId: installation.id } }),
    prisma.gitHubInstallation.delete({ where: { id: installation.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
