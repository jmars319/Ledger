import "server-only";
import type OpenAI from "openai";
import { getOpenAI } from "@/lib/ai/client";
import type { ContentType } from "@/lib/content/types";
import type { StylePreset } from "@/lib/content/stylePresets";
import { buildInstructionBlock, type InstructionContext } from "@/lib/ai/instructions";

export type GeneratedContentDraft = {
  title: string | null;
  summary: string | null;
  body: string | null;
  structured: Record<string, unknown> | null;
  assumptions: string[];
  openQuestions: string[];
  missingEvidence: string[];
};

export const CONTENT_DRAFT_PROMPT_VERSION = "content-draft-v1";

const typeGuidance: Record<ContentType, string> = {
  FIELD_NOTE: "Return 3–8 bullets, one idea per line. Keep it factual.",
  PROJECT_NOTE:
    "Return a structured row with case_study_slug, date (YYYY-MM-DD), metric, detail, source_link (optional).",
  SYSTEMS_MEMO: "Provide thesis, 3–5 points, optional example, and takeaway.",
  BLOG_FEATURE: "Write a markdown draft with a clear title and primary keyword focus.",
  CHANGE_LOG: "Provide a concise change log entry with date, change, and impact.",
  DECISION_RECORD: "Provide context, decision, tradeoffs, and outcome.",
  SIGNAL_LOG: "Provide signal statement, evidence bullets, and next action.",
};

export const generateContentDraft = async (input: {
  type: ContentType;
  stylePreset: StylePreset;
  sourceText: string;
  instructionContext?: InstructionContext;
  openai?: OpenAI;
}) => {
  const sourceText = input.sourceText.trim();
  if (!sourceText) {
    throw new Error("Source text is required.");
  }

  const instructionBlock = buildInstructionBlock(
    input.instructionContext ?? {
      style: input.stylePreset,
      context: [`Content type: ${input.type}`],
    },
  );

  const prompt =
    "You are generating a draft content item for a human review workflow.\n" +
    "Return JSON only. No markdown fences.\n" +
    "Keys: title, summary, body, structured, assumptions, openQuestions, missingEvidence.\n" +
    "assumptions/openQuestions/missingEvidence must be arrays of short strings.\n\n" +
    `${instructionBlock.block}\n\n` +
    `Content type: ${input.type}\n` +
    `Guidance: ${typeGuidance[input.type]}\n\n` +
    "Source material:\n" +
    sourceText +
    "\n\nJSON:";

  const client = input.openai ?? getOpenAI();
  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  const text = response.output_text?.trim();
  if (!text) {
    throw new Error("AI draft returned no output.");
  }

  let parsed: GeneratedContentDraft;
  try {
    parsed = JSON.parse(text) as GeneratedContentDraft;
  } catch {
    throw new Error("AI draft output was not valid JSON.");
  }

  return parsed;
};
