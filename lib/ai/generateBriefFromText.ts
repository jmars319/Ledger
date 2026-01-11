import "server-only";
import { openai } from "@/lib/ai/client";

export async function generateBriefFromText(input: { promptText: string }): Promise<string> {
  const promptText = input.promptText.trim();
  if (!promptText) {
    throw new Error("promptText is required.");
  }

  const prompt =
    "You are a project assistant. Produce a concise, general brief for human review.\n" +
    "Output plain text only. Avoid claims that cannot be supported.\n" +
    "Focus on what changed/learned, why it matters, and constraints.\n" +
    "If the prompt is broad, propose 3-5 concrete angles.\n\n" +
    `Prompt:\n${promptText}\n\nBrief:`;

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
