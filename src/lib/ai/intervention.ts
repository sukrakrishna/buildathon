import { z } from "zod";
import { getAnthropicClient, extractJson, messageText, AI_MODEL } from "./client";

const PlanSchema = z.object({
  tasks: z
    .array(z.object({ day: z.number().int().min(1).max(7), title: z.string() }))
    .length(7),
});

export interface InterventionTaskDraft {
  day: number;
  title: string;
}

export async function generateInterventionPlan(
  studentName: string,
  focusSubject: string,
  context: { summary: string; recommendations: string[] }
): Promise<{ tasks: InterventionTaskDraft[]; source: "ai" | "fallback" }> {
  const client = getAnthropicClient();
  if (!client) return { tasks: ruleBasedPlan(focusSubject), source: "fallback" };

  try {
    const message = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 600,
      system: `You write focused 7-day academic intervention plans for a specific student and subject, for a teacher to assign and track. Respond with ONLY valid JSON, no prose, no markdown fences, matching exactly:
{"tasks": [{"day": 1-7, "title": string}, ... exactly 7 items, one per day]}
Each title should be a single concrete, short (under 12 words) action — a mix of review, targeted practice, a teacher check-in, and a progress assessment. Grounded in the specific subject and the reason this student needs support; not generic study advice.`,
      messages: [
        {
          role: "user",
          content: `Student: ${studentName}\nFocus subject: ${focusSubject}\nWhy this student needs support: ${context.summary}\nExisting recommendations: ${context.recommendations.join("; ")}\n\nWrite the 7-day plan.`,
        },
      ],
    });

    const parsed = PlanSchema.safeParse(extractJson(messageText(message)));
    if (!parsed.success) throw new Error("AI response did not match expected schema");
    return { tasks: parsed.data.tasks.sort((a, b) => a.day - b.day), source: "ai" };
  } catch {
    return { tasks: ruleBasedPlan(focusSubject), source: "fallback" };
  }
}

function ruleBasedPlan(focusSubject: string): InterventionTaskDraft[] {
  return [
    { day: 1, title: `Review core concepts in ${focusSubject}` },
    { day: 2, title: `Complete 10 targeted practice problems in ${focusSubject}` },
    { day: 3, title: `Attend a ${focusSubject} teacher support session` },
    { day: 4, title: `Take a short practice assessment in ${focusSubject}` },
    { day: 5, title: `Review mistakes from the practice assessment` },
    { day: 6, title: `Catch up on any missing ${focusSubject} assignments` },
    { day: 7, title: `Progress check-in with teacher` },
  ];
}
