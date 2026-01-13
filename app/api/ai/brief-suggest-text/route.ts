import { NextResponse } from "next/server";
import { generateBriefFromText } from "@/lib/ai/generateBriefFromText";
import { getStylePreset } from "@/lib/content/stylePresets";

export async function POST(request: Request) {
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ error: "Brief suggestion requires STORAGE_MODE=db." }, { status: 400 });
  }

  const body = await request.json();
  const promptText = typeof body?.promptText === "string" ? body.promptText.trim() : "";
  const stylePresetId = typeof body?.stylePresetId === "string" ? body.stylePresetId : "";
  if (!promptText) {
    return NextResponse.json({ error: "promptText is required." }, { status: 400 });
  }

  try {
    const summary = await generateBriefFromText({ promptText, stylePreset: getStylePreset(stylePresetId) });
    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Brief suggestion failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
