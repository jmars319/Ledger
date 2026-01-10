import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const store = getStore();
  const draft = await store.getDraft(resolvedParams.id);
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(draft);
}
