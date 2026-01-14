import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { generateTaskSuggestion } from "@/lib/ai/generateTaskSuggestion";
import { requireApiContext } from "@/lib/auth/api";
import { resolveInstructionContext } from "@/lib/ai/instructions";

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
  const auth = await requireApiContext("AI_ASSIST");
  if (!auth.ok) return auth.response;

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
      const project = await prisma.project.findFirst({
        where: { id: projectId, workspaceId: auth.context.workspaceId },
      });
      projectName = project?.name;
    }

    const instructionContext = await resolveInstructionContext({
      workspaceId: auth.context.workspaceId,
      userId: auth.context.user.id,
      context: ["Manual task suggestion"],
    });
    const suggestion = await generateTaskSuggestion({ promptText, projectName, instructionContext });
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
