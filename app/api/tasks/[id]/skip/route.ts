import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const task = await store.updateTaskStatus(params.id, "SKIPPED");
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(task);
}
