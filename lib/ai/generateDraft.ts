import "server-only";
import { openai } from "@/lib/ai/client";

type DraftInput = {
  briefText: string;
  platform?: "twitter" | "instagram" | "linkedin" | "generic";
  repoNames?: string[];
  brandInstructions?: {
    tag?: string;
    tone?: string;
    hardRules?: string;
    doList?: string;
    dontList?: string;
  };
};

const platformInstructions: Record<NonNullable<DraftInput["platform"]>, string> = {
  twitter: "Write a concise post suited for X (Twitter). Keep it under 280 characters.",
  instagram: "Write a short caption suited for Instagram. Keep it punchy and readable.",
  linkedin: "Write a professional LinkedIn update. Keep it clear and pragmatic.",
  generic: "Write a concise social post.",
};

export async function generateDraft(input: DraftInput): Promise<string> {
  const briefText = input.briefText?.trim();
  if (!briefText) {
    throw new Error("briefText is required.");
  }

  const platform = input.platform ?? "generic";
  const repoLine = input.repoNames?.length
    ? `Repo context (names only): ${input.repoNames.join(", ")}`
    : "Repo context: none provided.";
  const brand = input.brandInstructions;
  const brandBlock = brand
    ? [
        `Brand tag: ${brand.tag ?? "unknown"}`,
        `Tone: ${brand.tone ?? "none"}`,
        `Hard rules: ${brand.hardRules ?? "none"}`,
        `Do: ${brand.doList ?? "none"}`,
        `Don't: ${brand.dontList ?? "none"}`,
      ].join("\n")
    : "Brand instructions: none provided.";
  const prompt =
    "You are drafting a social media post for a human review workflow.\n" +
    "The output must be plain text only. No markdown, no JSON, no hashtags unless explicitly asked.\n" +
    "Avoid claims of automation or posting. Keep it factual and reviewable.\n\n" +
    `Platform guidance: ${platformInstructions[platform]}\n\n` +
    `${repoLine}\n` +
    "Use repo names only for context; do not assume repository contents.\n\n" +
    `${brandBlock}\n\n` +
    `Brief:\n${briefText}\n\n` +
    "Draft:";

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  const text = (response.output_text ?? "").trim();
  if (!text) {
    throw new Error("Empty response from AI.");
  }
  return text;
}
