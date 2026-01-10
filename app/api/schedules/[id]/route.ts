import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const schedule = await store.getSchedule(params.id);
  if (!schedule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(schedule);
}
