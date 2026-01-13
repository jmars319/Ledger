import { NextResponse } from "next/server";
import { generateBriefFromText } from "@/lib/ai/generateBriefFromText";
import { getStylePreset } from "@/lib/content/stylePresets";
import { ingestFiles, buildCombinedText } from "@/lib/content/ingest";

const getFiles = (formData: FormData) => {
  const files: File[] = [];
  const single = formData.get("file");
  if (single instanceof File) files.push(single);
  for (const entry of formData.getAll("files")) {
    if (entry instanceof File) files.push(entry);
  }
  return files;
};

export async function POST(request: Request) {
  if (process.env.STORAGE_MODE !== "db") {
    return NextResponse.json({ error: "Brief draft requires STORAGE_MODE=db." }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI assist not configured." }, { status: 400 });
  }

  let promptText = "";
  let stylePresetId = "";
  let files: File[] = [];

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    promptText = typeof formData.get("promptText") === "string" ? String(formData.get("promptText")) : "";
    stylePresetId =
      typeof formData.get("stylePresetId") === "string" ? String(formData.get("stylePresetId")) : "";
    files = getFiles(formData);
  } else {
    const body = await request.json();
    promptText = typeof body?.promptText === "string" ? body.promptText : "";
    stylePresetId = typeof body?.stylePresetId === "string" ? body.stylePresetId : "";
  }

  const { attachments, warnings } = await ingestFiles(files);
  const combinedText = buildCombinedText(promptText, attachments);
  if (!combinedText.trim()) {
    return NextResponse.json({ error: "Provide prompt text or upload files." }, { status: 400 });
  }

  try {
    const stylePreset = getStylePreset(stylePresetId);
    const summary = await generateBriefFromText({ promptText: combinedText, stylePreset });
    return NextResponse.json({ summary, warnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Brief draft failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
