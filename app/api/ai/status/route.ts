import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/auth/api";

export async function GET() {
  const auth = await requireApiContext();
  if (!auth.ok) return auth.response;
  const configured = Boolean(process.env.OPENAI_API_KEY);
  return NextResponse.json({ configured });
}
