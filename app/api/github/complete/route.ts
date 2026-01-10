import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { hasGitHubEnv } from "@/lib/github/env";
import { githubAppFetch } from "@/lib/github/client";
import { syncInstallationRepos } from "@/lib/github/sync";

export async function POST(request: Request) {
  if (process.env.STORAGE_MODE !== "db" || !hasGitHubEnv()) {
    return NextResponse.json({ error: "GitHub not configured." }, { status: 400 });
  }

  const body = await request.json();
  const installationId = Number(body?.installationId);
  if (!Number.isFinite(installationId) || installationId <= 0) {
    return NextResponse.json({ error: "Invalid installationId." }, { status: 400 });
  }

  try {
    const prisma = getPrismaClient();
    const installationRes = await githubAppFetch(`/app/installations/${installationId}`);
    const installationBody = (await installationRes.json()) as {
      account?: { login?: string; type?: string };
    };

    const accountLogin = installationBody.account?.login ?? "unknown";
    const accountType = installationBody.account?.type ?? "Unknown";

    const installation = await prisma.gitHubInstallation.upsert({
      where: { installationId },
      update: { accountLogin, accountType },
      create: { installationId, accountLogin, accountType },
    });

    await syncInstallationRepos(prisma, installation.id, installationId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub API error.";
    return NextResponse.json({ error: "GitHub API error.", detail: message }, { status: 502 });
  }
}
