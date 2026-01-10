import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";

export async function POST(request: Request) {
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ error: "Tasks require STORAGE_MODE=db." }, { status: 400 });
  }

  const body = await request.json();
  if (!body?.projectId || typeof body.projectId !== "string") {
    return NextResponse.json({ error: "projectId is required." }, { status: 400 });
  }
  if (!body?.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }
  if (!body?.dueAt || typeof body.dueAt !== "string") {
    return NextResponse.json({ error: "dueAt is required." }, { status: 400 });
  }

  const dueAt = new Date(body.dueAt);
  if (Number.isNaN(dueAt.getTime())) {
    return NextResponse.json({ error: "dueAt must be a valid date." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const project = await prisma.project.findUnique({ where: { id: body.projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const task = await prisma.task.create({
    data: {
      projectId: body.projectId,
      title: body.title.trim(),
      status: "PENDING",
      dueAt,
      copyText: typeof body.copyText === "string" ? body.copyText.trim() : "",
    },
  });

  await prisma.auditLog.create({
    data: {
      actor: "admin",
      action: "TASK_CREATED",
      entityType: "Task",
      entityId: task.id,
      metadata: { projectId: body.projectId },
    },
  });

  return NextResponse.json(task);
}
