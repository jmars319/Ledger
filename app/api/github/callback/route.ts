import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { githubAppFetch } from "@/lib/github/client";
import { hasGitHubEnv } from "@/lib/github/env";
import { syncInstallationRepos } from "@/lib/github/sync";

const stateCookie = "ledger_github_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "";
  const installationIdParam = url.searchParams.get("installation_id") ?? "";
  const installationId = Number(installationIdParam);
  const cookieStore = await cookies();
  const storedState = cookieStore.get(stateCookie)?.value ?? "";

  const redirectWithClear = (path: string) => {
    const response = NextResponse.redirect(new URL(path, request.url));
    response.cookies.set(stateCookie, "", { path: "/", maxAge: 0 });
    return response;
  };

  if (!state || !storedState || state !== storedState) {
    return redirectWithClear("/settings/integrations/github?error=state");
  }

  if (process.env.STORAGE_MODE !== "db" || !hasGitHubEnv()) {
    return redirectWithClear("/settings/integrations/github?error=storage");
  }

  if (!Number.isFinite(installationId) || installationId <= 0) {
    return redirectWithClear("/settings/integrations/github?error=installation");
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

    return redirectWithClear("/settings/integrations/github?connected=1");
  } catch {
    return redirectWithClear("/settings/integrations/github?error=github_api");
  }
}
