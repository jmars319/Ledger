import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ error: "Briefs require STORAGE_MODE=db." }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ error: "Brief id is required." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const existing = await prisma.brief.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Brief not found." }, { status: 404 });
  }

  await prisma.brief.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      actor: "admin",
      action: "BRIEF_DELETED",
      entityType: "Brief",
      entityId: id,
    },
  });

  return NextResponse.json({ ok: true });
}
