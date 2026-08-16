import { unstable_cache } from "next/cache";
import { getAnthropicClient, extractJson, messageText, AI_MODEL } from "./client";

export interface StudyTip {
  title: string;
  tip: string;
}

const FALLBACK_TIPS: StudyTip[] = [
  { title: "Spaced repetition", tip: "Review new material after 1 day, 3 days, and a week — it beats one long cram session for long-term recall." },
  { title: "Active recall", tip: "Close the book and try to explain the concept out loud before checking your notes." },
  { title: "Interleave subjects", tip: "Mix topics in a single study session instead of blocking one subject for hours — it improves retention." },
];

async function fetchStudyTips(): Promise<{ tips: StudyTip[]; source: "ai" | "fallback" }> {
  const client = getAnthropicClient();
  if (!client) return { tips: FALLBACK_TIPS, source: "fallback" };

  try {
    const message = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 400,
      system:
        "You write short, practical study tips for a university/school portal homepage. Respond with ONLY a JSON array, no prose, no markdown fences.",
      messages: [
        {
          role: "user",
          content:
            'Give 3 short, practical, non-generic study tips for students. JSON shape: [{"title": string (<=4 words), "tip": string (<=140 chars)}]',
        },
      ],
    });

    const parsed = extractJson<StudyTip[]>(messageText(message));
    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) throw new Error("bad response shape");
    return { tips: parsed.slice(0, 3), source: "ai" };
  } catch {
    return { tips: FALLBACK_TIPS, source: "fallback" };
  }
}

export const getStudyTips = unstable_cache(fetchStudyTips, ["home-ai-study-tips"], {
  revalidate: 3600,
  tags: ["ai-study-tips"],
});
