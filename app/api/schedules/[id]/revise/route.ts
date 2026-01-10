import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const body = await request.json().catch(() => ({}));
  const note = typeof body?.note === "string" ? body.note : undefined;
  const store = getStore();
  const schedule = await store.updateScheduleStatus(resolvedParams.id, "REVISION_REQUESTED", note);
  if (!schedule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(schedule);
}
