import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";

export async function GET() {
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ error: "Projects require STORAGE_MODE=db." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const projects = await prisma.project.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ error: "Projects require STORAGE_MODE=db." }, { status: 400 });
  }

  const body = await request.json();
  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }
  if (!body?.tag || typeof body.tag !== "string") {
    return NextResponse.json({ error: "tag is required." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  try {
    const project = await prisma.project.create({
      data: {
        name: body.name.trim(),
        tag: body.tag.trim().toUpperCase(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: "admin",
        action: "PROJECT_CREATED",
        entityType: "Project",
        entityId: project.id,
        metadata: { tag: project.tag },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
