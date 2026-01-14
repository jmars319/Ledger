import "server-only";
import { getOpenAI } from "@/lib/ai/client";
import type { StylePreset } from "@/lib/content/stylePresets";
import { buildInstructionBlock, type InstructionContext } from "@/lib/ai/instructions";

type PostInput = {
  briefText: string;
  platform?:
    | "twitter"
    | "instagram"
    | "linkedin"
    | "facebook"
    | "gbp"
    | "youtube"
    | "threads"
    | "tiktok"
    | "mastodon"
    | "bluesky"
    | "reddit"
    | "pinterest"
    | "snapchat"
    | "generic";
  repoNames?: string[];
  evidenceItems?: {
    type: string;
    title: string;
    body?: string | null;
    content?: string | null;
  }[];
  brandInstructions?: {
    tag?: string;
    tone?: string;
    hardRules?: string;
    doList?: string;
    dontList?: string;
  };
  stylePreset?: StylePreset;
  instructionContext?: InstructionContext;
};

const platformInstructions: Record<NonNullable<PostInput["platform"]>, string> = {
  twitter: "Write a concise post suited for X (Twitter). Keep it under 280 characters.",
  instagram: "Write a short caption suited for Instagram. Keep it punchy and readable.",
  linkedin: "Write a professional LinkedIn update. Keep it clear and pragmatic.",
  facebook: "Write a friendly Facebook update. Keep it conversational and clear.",
  gbp: "Write a short Google Business Profile update. Keep it direct and locally relevant.",
  youtube: "Write a YouTube Community post. Keep it short, friendly, and clear.",
  threads: "Write a Threads post. Keep it short and conversational.",
  tiktok: "Write a short TikTok caption. Keep it punchy and informal.",
  mastodon: "Write a Mastodon post. Keep it concise and informative.",
  bluesky: "Write a Bluesky post. Keep it concise and conversational.",
  reddit: "Write a Reddit post. Keep it informative with a straightforward tone.",
  pinterest: "Write a Pinterest caption. Keep it short and descriptive.",
  snapchat: "Write a Snapchat caption. Keep it casual and very short.",
  generic: "Write a concise social post.",
};

const truncateText = (value: string, limit: number) =>
  value.length > limit ? `${value.slice(0, limit).trim()}...` : value;

export async function generatePost(input: PostInput): Promise<string> {
  const briefText = input.briefText?.trim();
  if (!briefText) {
    throw new Error("briefText is required.");
  }

  const platform = input.platform ?? "generic";
  const repoLine = input.repoNames?.length
    ? `Repo context (names only): ${input.repoNames.join(", ")}`
    : "Repo context: none provided.";
  const evidenceBlock = input.evidenceItems?.length
    ? input.evidenceItems
        .slice(0, 30)
        .map((item) => {
          const lines = [
            `Type: ${item.type}`,
            `Title: ${item.title}`,
            item.body ? `Body: ${truncateText(item.body, 400)}` : null,
            item.content ? `Content: ${truncateText(item.content, 800)}` : null,
          ].filter(Boolean);
          return lines.join("\n");
        })
        .join("\n\n---\n\n")
    : "No evidence items provided.";
  const instructionBlock = buildInstructionBlock(
    input.instructionContext ?? {
      style: input.stylePreset,
      org: input.brandInstructions,
      context: [`Platform: ${platform}`],
    },
  );
  const prompt =
    "You are drafting a social media post for a human review workflow.\n" +
    "The output must be plain text only. No markdown, no JSON, no hashtags unless explicitly asked.\n" +
    "Avoid claims of automation or posting. Keep it factual and reviewable.\n\n" +
    `Platform guidance: ${platformInstructions[platform]}\n\n` +
    `${instructionBlock.block}\n\n` +
    `${repoLine}\n` +
    "Use repo names only for context; do not assume repository contents.\n" +
    "Use evidence items to ground claims; do not invent details beyond evidence and the brief.\n\n" +
    "Evidence:\n" +
    `${evidenceBlock}\n\n` +
    `Brief:\n${briefText}\n\n` +
    "Post:";

  const response = await getOpenAI().responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  const text = (response.output_text ?? "").trim();
  if (!text) {
    throw new Error("Empty response from AI.");
  }
  return text;
}
