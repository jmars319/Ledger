import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { generateBrief } from "@/lib/ai/generateBrief";

export async function POST(request: Request) {
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ error: "Brief suggestion requires STORAGE_MODE=db." }, { status: 400 });
  }

  const body = await request.json();
  const bundleId = typeof body?.bundleId === "string" ? body.bundleId : "";
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

  if (!bundleId) {
    return NextResponse.json({ error: "bundleId is required." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  if (!("evidenceBundle" in prisma) || !("evidenceItem" in prisma)) {
    return NextResponse.json(
      { error: "Evidence tables not available. Run prisma generate and migrate." },
      { status: 500 }
    );
  }
  const bundle = await prisma.evidenceBundle.findUnique({
    where: { id: bundleId },
    include: { items: true },
  });
  if (!bundle) {
    return NextResponse.json({ error: "Evidence bundle not found." }, { status: 404 });
  }

  const fullCoverage = await prisma.evidenceBundle.findFirst({
    where: { repoId: bundle.repoId, scope: "FULL" },
  });

  const text = await generateBrief({
    repoFullName: bundle.repoFullName,
    items: bundle.items.map((item) => ({
      type: item.type,
      title: item.title,
      body: item.body,
      url: item.url,
      occurredAt: item.occurredAt.toISOString(),
      content: item.content,
    })),
    coverage: {
      scope: bundle.scope,
      scopeValue: bundle.scopeValue,
      scopePage: bundle.scopePage,
      autoSelected: bundle.autoSelected,
      fullCoverageComplete: Boolean(fullCoverage),
    },
    brandInstructions: instructions,
  });

  return NextResponse.json({ summary: text });
}
