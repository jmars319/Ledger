import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const draft = await store.updateDraftStatus(params.id, "APPROVED");
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(draft);
}
