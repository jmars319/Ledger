import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const draft = await store.getDraft(params.id);
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(draft);
}
