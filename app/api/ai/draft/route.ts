import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { generateDraft } from "@/lib/ai/generateDraft";

type Platform = "twitter" | "instagram" | "linkedin" | "generic";

const normalizePlatform = (value?: string): Platform => {
  switch ((value ?? "").toLowerCase()) {
    case "twitter":
    case "x":
      return "twitter";
    case "instagram":
      return "instagram";
    case "linkedin":
      return "linkedin";
    default:
      return "generic";
  }
};

export async function POST(request: Request) {
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ error: "AI drafting requires STORAGE_MODE=db." }, { status: 400 });
  }

  const body = await request.json();
  if (!body?.briefId || typeof body.briefId !== "string") {
    return NextResponse.json({ error: "briefId is required." }, { status: 400 });
  }

  const platform = normalizePlatform(body.platform);
  const repoIds = Array.isArray(body.repoIds)
    ? body.repoIds.filter((id: unknown) => typeof id === "string" && id.trim().length > 0)
    : [];
  const brandTag = typeof body.brandTag === "string" ? body.brandTag : undefined;
  const instructions =
    body.instructions && typeof body.instructions === "object"
      ? {
          tag: typeof body.instructions.tag === "string" ? body.instructions.tag : undefined,
          tone: typeof body.instructions.tone === "string" ? body.instructions.tone : undefined,
          hardRules:
            typeof body.instructions.hardRules === "string" ? body.instructions.hardRules : undefined,
          doList: typeof body.instructions.doList === "string" ? body.instructions.doList : undefined,
          dontList:
            typeof body.instructions.dontList === "string" ? body.instructions.dontList : undefined,
        }
      : undefined;

  try {
    const prisma = getPrismaClient();
    const brief = await prisma.brief.findUnique({ where: { id: body.briefId } });
    if (!brief) {
      return NextResponse.json({ error: "Brief not found." }, { status: 404 });
    }

    if (repoIds.length === 0) {
      return NextResponse.json({ error: "At least one repo is required." }, { status: 400 });
    }

    const repos = await prisma.repoAccess.findMany({ where: { id: { in: repoIds } } });
    const repoNames = repos.map((repo) => repo.repo);
    const repoTags = Array.from(new Set(repos.map((repo) => repo.projectTag)));

    if (!brandTag && !instructions?.tag && repoTags.length > 1) {
      return NextResponse.json(
        { error: "Brand selection is required when using multiple repo tags." },
        { status: 400 }
      );
    }

    const text = await generateDraft({
      briefText: brief.summary,
      platform,
      repoNames,
      brandInstructions:
        instructions ?? (brandTag ? { tag: brandTag } : repoTags[0] ? { tag: repoTags[0] } : undefined),
    });

    const draft = await prisma.draft.create({
      data: {
        projectId: brief.projectId,
        platform,
        title: `AI draft (${platform})`,
        status: "NEEDS_REVIEW",
        draftJson: {
          text,
          platform,
          source: "openai",
          model: "gpt-5-mini",
          repoIds,
          repoNames,
          brandTag: brandTag ?? instructions?.tag,
        },
        claims: [],
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: "system:ai",
        action: "generate_draft",
        entityType: "Draft",
        entityId: draft.id,
        note: `Draft generated for brief ${brief.id}.`,
        metadata: { briefId: brief.id, platform, model: "gpt-5-mini", repoIds, repoNames },
      },
    });

    return NextResponse.json(draft);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI draft failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
