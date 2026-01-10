import "server-only";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is required for AI requests.");
}

export const openai = new OpenAI({ apiKey });
