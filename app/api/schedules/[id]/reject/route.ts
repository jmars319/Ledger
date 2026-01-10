import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const note = typeof body?.note === "string" ? body.note : undefined;
  const store = getStore();
  const schedule = await store.updateScheduleStatus(params.id, "REJECTED", note);
  if (!schedule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(schedule);
}
