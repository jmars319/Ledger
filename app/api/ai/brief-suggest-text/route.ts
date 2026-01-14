import { NextResponse } from "next/server";
import { generateBriefFromText } from "@/lib/ai/generateBriefFromText";
import { requireApiContext } from "@/lib/auth/api";
import { resolveInstructionContext } from "@/lib/ai/instructions";

export async function POST(request: Request) {
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ error: "Brief suggestion requires STORAGE_MODE=db." }, { status: 400 });
  }
  const auth = await requireApiContext("AI_BRIEFS");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const promptText = typeof body?.promptText === "string" ? body.promptText.trim() : "";
  const stylePresetId = typeof body?.stylePresetId === "string" ? body.stylePresetId : undefined;
  if (!promptText) {
    return NextResponse.json({ error: "promptText is required." }, { status: 400 });
  }

  try {
    const instructionContext = await resolveInstructionContext({
      workspaceId: auth.context.workspaceId,
      userId: auth.context.user.id,
      stylePresetId,
      context: ["General brief request"],
    });
    const summary = await generateBriefFromText({ promptText, instructionContext });
    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Brief suggestion failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
