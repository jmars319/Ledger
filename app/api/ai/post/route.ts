import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { generatePost } from "@/lib/ai/generatePost";
import { getStylePreset } from "@/lib/content/stylePresets";
import { requireApiContext } from "@/lib/auth/api";
import { resolveInstructionContext } from "@/lib/ai/instructions";

type Platform =
  | "twitter"
  | "instagram"
  | "linkedin"
  | "facebook"
  | "gbp"
  | "youtube"
  | "threads"
  | "tiktok"
  | "mastodon"
  | "bluesky"
  | "reddit"
  | "pinterest"
  | "snapchat"
  | "generic";

const normalizePlatform = (value?: string): Platform => {
  switch ((value ?? "").toLowerCase()) {
    case "twitter":
    case "x":
      return "twitter";
    case "instagram":
      return "instagram";
    case "linkedin":
      return "linkedin";
    case "facebook":
    case "fb":
      return "facebook";
    case "gbp":
    case "google":
    case "google-business":
      return "gbp";
    case "youtube":
    case "yt":
      return "youtube";
    case "threads":
      return "threads";
    case "tiktok":
    case "tt":
      return "tiktok";
    case "mastodon":
      return "mastodon";
    case "bluesky":
      return "bluesky";
    case "reddit":
      return "reddit";
    case "pinterest":
      return "pinterest";
    case "snapchat":
      return "snapchat";
    default:
      return "generic";
  }
};

export async function POST(request: Request) {
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ error: "AI posts require STORAGE_MODE=db." }, { status: 400 });
  }
  const auth = await requireApiContext("AI_ASSIST");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  if (!body?.briefId || typeof body.briefId !== "string") {
    return NextResponse.json({ error: "briefId is required." }, { status: 400 });
  }

  const platform = normalizePlatform(body.platform);
  const repoIds = Array.isArray(body.repoIds)
    ? body.repoIds.filter((id: unknown) => typeof id === "string" && id.trim().length > 0)
    : [];
  const stylePresetId = typeof body.stylePresetId === "string" ? body.stylePresetId : undefined;
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
    const brief = await prisma.brief.findFirst({
      where: { id: body.briefId, workspaceId: auth.context.workspaceId },
    });
    if (!brief) {
      return NextResponse.json({ error: "Brief not found." }, { status: 404 });
    }

    if (repoIds.length === 0) {
      return NextResponse.json({ error: "At least one repo is required." }, { status: 400 });
    }

    const repos = await prisma.repoAccess.findMany({
      where: { id: { in: repoIds }, workspaceId: auth.context.workspaceId },
    });
    if (repos.length !== repoIds.length) {
      return NextResponse.json({ error: "One or more repos were not found." }, { status: 404 });
    }
    const repoNames = repos.map((repo) => repo.repo);
    const repoTags = Array.from(new Set(repos.map((repo) => repo.projectTag)));

    if (!brandTag && !instructions?.tag && repoTags.length > 1) {
      return NextResponse.json(
        { error: "Brand selection is required when using multiple repo tags." },
        { status: 400 }
      );
    }

    const evidenceDocs = brief.evidenceBundleId
      ? await prisma.evidenceItem.findMany({
          where: { bundleId: brief.evidenceBundleId, type: "DOCUMENTATION", workspaceId: auth.context.workspaceId },
          orderBy: { title: "asc" },
          take: 5,
        })
      : [];
    const evidenceRecent = brief.evidenceBundleId
      ? await prisma.evidenceItem.findMany({
          where: {
            bundleId: brief.evidenceBundleId,
            type: { not: "DOCUMENTATION" },
            workspaceId: auth.context.workspaceId,
          },
          orderBy: { occurredAt: "desc" },
          take: 20,
        })
      : [];
    const evidenceItems = [...evidenceDocs, ...evidenceRecent];

    const stylePreset = getStylePreset(stylePresetId);
    const instructionContext = await resolveInstructionContext({
      workspaceId: auth.context.workspaceId,
      userId: auth.context.user.id,
      stylePresetId,
      orgTag: brandTag ?? instructions?.tag ?? repoTags[0],
      orgOverride: instructions,
      context: [`Platform: ${platform}`],
    });
    const text = await generatePost({
      briefText: brief.summary,
      platform,
      repoNames,
      evidenceItems: evidenceItems.map((item) => ({
        type: item.type,
        title: item.title,
        body: item.body,
        content: item.content,
      })),
      stylePreset,
      brandInstructions:
        instructions ?? (brandTag ? { tag: brandTag } : repoTags[0] ? { tag: repoTags[0] } : undefined),
      instructionContext,
    });

    const post = await prisma.post.create({
      data: {
        workspaceId: auth.context.workspaceId,
        projectId: brief.projectId,
        platform,
        title: `AI post (${platform})`,
        status: "NEEDS_REVIEW",
        postJson: {
          text,
          platform,
          source: "openai",
          model: "gpt-5-mini",
          stylePresetId: stylePreset.id,
          repoIds,
          repoNames,
          brandTag: brandTag ?? instructions?.tag,
          evidenceBundleId: brief.evidenceBundleId ?? undefined,
        },
        claims: [],
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: "system:ai",
        action: "generate_post",
        entityType: "Post",
        entityId: post.id,
        workspaceId: auth.context.workspaceId,
        note: `Post generated for brief ${brief.id}.`,
        metadata: { briefId: brief.id, platform, model: "gpt-5-mini", repoIds, repoNames, stylePresetId: stylePreset.id },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI post failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
