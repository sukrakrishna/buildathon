import { z } from "zod";
import { getAnthropicClient, extractJson, messageText, AI_MODEL } from "./client";
import type { StudentPerformanceSummary } from "@/lib/data/academics";

const InsightSchema = z.object({
  riskLevel: z.enum(["low", "medium", "high"]),
  weakSubjects: z.array(z.string()).max(10),
  recommendations: z.array(z.string()).max(8),
  summary: z.string(),
});

export type AiInsightResult = z.infer<typeof InsightSchema>;

export async function generateStudentInsight(
  studentName: string,
  summary: StudentPerformanceSummary
): Promise<{ result: AiInsightResult; source: "ai" | "fallback" }> {
  const client = getAnthropicClient();
  if (!client) return { result: ruleBasedInsight(summary), source: "fallback" };

  try {
    const message = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      system: `You are an academic performance analyst embedded in an education platform. Analyze a student's attendance, assignment scores, and exam grades to flag a risk level, identify weak subjects, and give specific, actionable study recommendations grounded in the actual numbers you're given — not generic advice. Respond with ONLY valid JSON, no prose, no markdown fences, matching exactly this shape:
{"riskLevel": "low"|"medium"|"high", "weakSubjects": string[], "recommendations": string[], "summary": string}

Guidance:
- riskLevel "high" if attendance < 70% OR overall average < 60%.
- riskLevel "medium" if attendance is 70-85% OR overall average is 60-75%.
- riskLevel "low" otherwise.
- weakSubjects: subject names with a combined average below 70%, worst first. Empty array if none.
- recommendations: 3-5 specific tips tied to the weak subjects and patterns in the data (e.g. missed submissions, low exam vs. assignment scores).
- summary: 2-3 plain-language sentences on how this student is doing overall.`,
      messages: [{ role: "user", content: buildPrompt(studentName, summary) }],
    });

    const parsed = InsightSchema.safeParse(extractJson(messageText(message)));
    if (!parsed.success) throw new Error("AI response did not match expected schema");
    return { result: parsed.data, source: "ai" };
  } catch {
    return { result: ruleBasedInsight(summary), source: "fallback" };
  }
}

function buildPrompt(name: string, s: StudentPerformanceSummary): string {
  const subjectLines = s.subjects
    .map(
      (sub) =>
        `- ${sub.subject}: attendance ${sub.attendanceRate ?? "N/A"}%, assignment avg ${sub.assignmentAvgPercent ?? "N/A"}%, exam avg ${sub.examAvgPercent ?? "N/A"}%`
    )
    .join("\n");

  return `Student: ${name}
Overall attendance: ${s.attendanceRate ?? "N/A"}% (${s.attendancePresent}/${s.attendanceTotal} sessions)
Overall assignment average: ${s.overallAssignmentAvgPercent ?? "N/A"}%
Overall exam average: ${s.overallExamAvgPercent ?? "N/A"}%

Per-subject breakdown:
${subjectLines || "No subject data yet."}

Recent submissions: ${JSON.stringify(s.recentSubmissions.slice(0, 5))}
Recent exam grades: ${JSON.stringify(s.recentGrades.slice(0, 5))}

Analyze this student's performance and respond with the JSON described in the system prompt.`;
}

// Used when ANTHROPIC_API_KEY isn't configured, or the AI call/parse fails.
// Still computed from the real aggregated numbers — just rule-based instead of LLM-generated.
function ruleBasedInsight(s: StudentPerformanceSummary): AiInsightResult {
  const overallAvg = avgOf([s.overallAssignmentAvgPercent, s.overallExamAvgPercent]);
  const attendance = s.attendanceRate;

  let riskLevel: AiInsightResult["riskLevel"] = "low";
  if ((attendance != null && attendance < 70) || (overallAvg != null && overallAvg < 60)) riskLevel = "high";
  else if ((attendance != null && attendance < 85) || (overallAvg != null && overallAvg < 75)) riskLevel = "medium";

  const weakSubjects = s.subjects
    .filter((sub) => {
      const combined = avgOf([sub.assignmentAvgPercent, sub.examAvgPercent]);
      return combined != null && combined < 70;
    })
    .map((sub) => sub.subject);

  const recommendations: string[] = [];
  if (attendance != null && attendance < 85) {
    recommendations.push(`Improve attendance — you've attended ${attendance}% of sessions so far; aim for 90%+ to stay on track.`);
  }
  for (const subject of weakSubjects.slice(0, 3)) {
    recommendations.push(`Review core concepts in ${subject} and consider extra practice or office hours.`);
  }
  if (s.recentSubmissions.some((sub) => sub.scorePercent == null)) {
    recommendations.push("Stay on top of upcoming assignment deadlines — some recent submissions are still ungraded or missing.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Keep up the consistent work across all subjects.");
  }

  const tone = riskLevel === "high" ? "concerning" : riskLevel === "medium" ? "mixed" : "solid";
  const summary =
    weakSubjects.length > 0
      ? `Overall performance is ${tone}, with the biggest gaps in ${weakSubjects.join(", ")}.${
          attendance != null && attendance < 85 ? ` Attendance (${attendance}%) is also a factor.` : ""
        }`
      : `Overall performance is ${riskLevel === "low" ? "solid across all subjects" : "generally on track"}.${
          attendance != null && attendance < 85 ? ` Attendance (${attendance}%) could improve.` : ""
        }`;

  return { riskLevel, weakSubjects, recommendations: recommendations.slice(0, 5), summary };
}

function avgOf(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n != null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}
