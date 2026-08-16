import { getAnthropicClient, messageText, AI_MODEL } from "./client";

const FALLBACK_FEEDBACK =
  "Thanks for submitting! Your teacher will review this and share detailed feedback soon.";

export async function generateSubmissionFeedback(input: {
  assignmentTitle: string;
  assignmentDescription: string | null;
  content: string;
}): Promise<{ feedback: string; source: "ai" | "fallback" }> {
  const client = getAnthropicClient();
  if (!client || !input.content.trim()) return { feedback: FALLBACK_FEEDBACK, source: "fallback" };

  try {
    const message = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 250,
      system:
        "You are a supportive teaching assistant giving quick feedback on a student's assignment submission. 2-3 sentences, specific and constructive, not generic praise. Plain text only, no markdown.",
      messages: [
        {
          role: "user",
          content: `Assignment: ${input.assignmentTitle}\n${input.assignmentDescription ? `Instructions: ${input.assignmentDescription}\n` : ""}\nStudent submission:\n"""\n${input.content.slice(0, 4000)}\n"""\n\nGive brief, specific feedback on this submission.`,
        },
      ],
    });

    const text = messageText(message).trim();
    if (!text) throw new Error("empty response");
    return { feedback: text, source: "ai" };
  } catch {
    return { feedback: FALLBACK_FEEDBACK, source: "fallback" };
  }
}
