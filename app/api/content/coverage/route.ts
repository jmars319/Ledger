import { NextResponse } from "next/server";
import { getCoverageMatrix } from "@/lib/content/service";

export async function GET() {
  try {
    const data = await getCoverageMatrix();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Coverage failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
