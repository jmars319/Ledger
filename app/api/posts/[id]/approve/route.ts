import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const store = getStore();
  const post = await store.updatePostStatus(resolvedParams.id, "APPROVED");
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(post);
}
