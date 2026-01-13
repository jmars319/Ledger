import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(process.env.OPENAI_API_KEY);
  return NextResponse.json({ configured });
}
