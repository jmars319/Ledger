import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  const tasks = await store.listTasks();
  return NextResponse.json(tasks);
}
