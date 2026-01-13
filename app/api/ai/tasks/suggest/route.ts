import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { generateTaskSuggestion } from "@/lib/ai/generateTaskSuggestion";

const fallbackDueAt = () => {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  date.setHours(10, 0, 0, 0);
  return date;
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI assist not configured." }, { status: 400 });
  }

  const body = await request.json();
  const promptText = typeof body?.promptText === "string" ? body.promptText.trim() : "";
  const projectId = typeof body?.projectId === "string" ? body.projectId : "";
  if (!promptText) {
    return NextResponse.json({ error: "promptText is required." }, { status: 400 });
  }

  try {
    let projectName: string | undefined;
    if (process.env.STORAGE_MODE === "db" && projectId) {
      const prisma = getPrismaClient();
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      projectName = project?.name;
    }

    const suggestion = await generateTaskSuggestion({ promptText, projectName });
    const dueAt = suggestion.dueAt ? new Date(suggestion.dueAt) : fallbackDueAt();
    const safeDueAt = Number.isNaN(dueAt.getTime()) ? fallbackDueAt() : dueAt;

    return NextResponse.json({
      ok: true,
      suggestion: {
        title: suggestion.title,
        copyText: suggestion.copyText,
        dueAt: safeDueAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Task suggestion failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
