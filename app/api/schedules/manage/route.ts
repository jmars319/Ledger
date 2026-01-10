import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";

export async function POST(request: Request) {
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ error: "Schedules require STORAGE_MODE=db." }, { status: 400 });
  }

  const body = await request.json();
  if (!body?.draftId || typeof body.draftId !== "string") {
    return NextResponse.json({ error: "draftId is required." }, { status: 400 });
  }
  if (!body?.scheduledFor || typeof body.scheduledFor !== "string") {
    return NextResponse.json({ error: "scheduledFor is required." }, { status: 400 });
  }
  if (!body?.channel || typeof body.channel !== "string") {
    return NextResponse.json({ error: "channel is required." }, { status: 400 });
  }

  const scheduledFor = new Date(body.scheduledFor);
  if (Number.isNaN(scheduledFor.getTime())) {
    return NextResponse.json({ error: "scheduledFor must be a valid date." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const draft = await prisma.draft.findUnique({ where: { id: body.draftId } });
  if (!draft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  const schedule = await prisma.scheduleProposal.create({
    data: {
      projectId: draft.projectId,
      status: "NEEDS_REVIEW",
      items: {
        create: {
          draftId: draft.id,
          channel: body.channel.trim(),
          scheduledFor,
        },
      },
    },
    include: { items: true },
  });

  await prisma.auditLog.create({
    data: {
      actor: "admin",
      action: "SCHEDULE_CREATED",
      entityType: "ScheduleProposal",
      entityId: schedule.id,
      metadata: { draftId: draft.id },
    },
  });

  return NextResponse.json({
    id: schedule.id,
    projectId: schedule.projectId,
    status: schedule.status,
    items: schedule.items.map((item) => ({
      id: item.id,
      draftId: item.draftId,
      channel: item.channel,
      scheduledFor: item.scheduledFor.toISOString(),
    })),
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
  });
}
