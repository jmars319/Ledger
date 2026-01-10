import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  const repos = await store.listRepos();
  return NextResponse.json(repos);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!Array.isArray(body?.repos)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const store = getStore();
  const repos = await store.updateRepos(body.repos);
  return NextResponse.json(repos);
}
