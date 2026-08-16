import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

// Latest, most capable model — see claude-api skill / model list.
export const AI_MODEL = "claude-sonnet-5";

let cachedClient: Anthropic | null | undefined;

// Returns null when ANTHROPIC_API_KEY isn't configured, so callers can fall
// back to a clearly-labeled rule-based response instead of crashing.
export function getAnthropicClient(): Anthropic | null {
  if (cachedClient !== undefined) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  cachedClient = apiKey ? new Anthropic({ apiKey }) : null;
  return cachedClient;
}

export function messageText(message: Message): string {
  return message.content.map((block) => (block.type === "text" ? block.text : "")).join("");
}

export function extractJson<T = unknown>(text: string): T | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  const closer = candidate[start] === "[" ? "]" : "}";
  const end = candidate.lastIndexOf(closer);
  if (end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
