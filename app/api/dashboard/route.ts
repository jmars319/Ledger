import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  const data = await store.getDashboard();
  return NextResponse.json(data);
}
