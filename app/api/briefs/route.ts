import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";

export async function GET() {
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ error: "Briefs require STORAGE_MODE=db." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const briefs = await prisma.brief.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(briefs);
}

export async function POST(request: Request) {
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ error: "Briefs require STORAGE_MODE=db." }, { status: 400 });
  }

  const body = await request.json();
  if (!body?.projectId || typeof body.projectId !== "string") {
    return NextResponse.json({ error: "projectId is required." }, { status: 400 });
  }
  if (!body?.summary || typeof body.summary !== "string") {
    return NextResponse.json({ error: "summary is required." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const project = await prisma.project.findUnique({ where: { id: body.projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const brief = await prisma.brief.create({
    data: {
      projectId: body.projectId,
      summary: body.summary.trim(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actor: "admin",
      action: "BRIEF_CREATED",
      entityType: "Brief",
      entityId: brief.id,
      metadata: { projectId: body.projectId },
    },
  });

  return NextResponse.json(brief);
}
