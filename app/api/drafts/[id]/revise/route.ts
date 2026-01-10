import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const note = typeof body?.note === "string" ? body.note : undefined;
  const store = getStore();
  const draft = await store.updateDraftStatus(params.id, "REVISION_REQUESTED", note);
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(draft);
}
