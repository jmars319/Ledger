import { NextResponse } from "next/server";
import { getContentStatus } from "@/lib/content/service";

export async function GET() {
  try {
    const data = await getContentStatus();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Content status failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
