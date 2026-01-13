import "server-only";
import OpenAI from "openai";

let cached: OpenAI | null = null;

export const getOpenAI = () => {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for AI requests.");
  }
  cached = new OpenAI({ apiKey });
  return cached;
};
