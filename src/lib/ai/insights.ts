import { z } from "zod";
import { getAnthropicClient, extractJson, messageText, AI_MODEL } from "./client";
import { computeFactors, computeTrend, computeConfidence, type Factor, type Trend } from "./evidence";
import type { StudentPerformanceSummary } from "@/lib/data/academics";

// Claude (or the rule-based fallback) only ever produces these four fields —
// the judgment/narrative layer. Evidence (factors/trend/confidence) is
// computed separately and merged in below; it is never something the model
// can hallucinate its way into.
const JudgmentSchema = z.object({
  riskLevel: z.enum(["low", "medium", "high"]),
  weakSubjects: z.array(z.string()).max(10),
  recommendations: z.array(z.string()).max(8),
  summary: z.string(),
});
type Judgment = z.infer<typeof JudgmentSchema>;

export interface AiInsightResult extends Judgment {
  confidence: number;
  factors: Factor[];
  trend: Trend | null;
}

export async function generateStudentInsight(
  studentName: string,
  summary: StudentPerformanceSummary
): Promise<{ result: AiInsightResult; source: "ai" | "fallback" }> {
  const factors = computeFactors(summary);
  const trend = computeTrend(summary);
  const confidence = computeConfidence(summary);

  const client = getAnthropicClient();
  if (!client) {
    return { result: { ...ruleBasedJudgment(studentName, summary, factors, trend), confidence, factors, trend }, source: "fallback" };
  }

  try {
    const message = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      system: `You are an academic early-warning analyst embedded in an education platform. You are given a student's PRE-COMPUTED evidence (attendance, assignment, and exam factors, and a performance trend) — treat these numbers as ground truth, do not recompute or contradict them. Your job is to explain WHY the student is at risk in plain cause-and-effect language, identify weak subjects, and give specific, actionable recommendations tied to the evidence — not generic advice. Respond with ONLY valid JSON, no prose, no markdown fences, matching exactly this shape:
{"riskLevel": "low"|"medium"|"high", "weakSubjects": string[], "recommendations": string[], "summary": string}

Guidance:
- riskLevel "high" if attendance < 70% OR overall average < 60%.
- riskLevel "medium" if attendance is 70-85% OR overall average is 60-75%.
- riskLevel "low" otherwise.
- weakSubjects: subject names with a combined average below 70%, worst first. Empty array if none.
- recommendations: 3-5 specific tips tied to the weak subjects and the evidence you were given (e.g. a specific subject's exam score, missed submissions, a declining trend).
- summary: 2-3 sentences written as an explanation of CAUSE, in the style of "[Name] is at [risk level] risk primarily because [specific factor] while [another specific factor]." Use the actual numbers you were given. This is the single most visible sentence in the product — make it concrete, not generic.`,
      messages: [{ role: "user", content: buildPrompt(studentName, summary, factors, trend) }],
    });

    const parsed = JudgmentSchema.safeParse(extractJson(messageText(message)));
    if (!parsed.success) throw new Error("AI response did not match expected schema");
    return { result: { ...parsed.data, confidence, factors, trend }, source: "ai" };
  } catch {
    return { result: { ...ruleBasedJudgment(studentName, summary, factors, trend), confidence, factors, trend }, source: "fallback" };
  }
}

function buildPrompt(name: string, s: StudentPerformanceSummary, factors: Factor[], trend: Trend | null): string {
  const subjectLines = s.subjects
    .map(
      (sub) =>
        `- ${sub.subject}: attendance ${sub.attendanceRate ?? "N/A"}%, assignment avg ${sub.assignmentAvgPercent ?? "N/A"}%, exam avg ${sub.examAvgPercent ?? "N/A"}%`
    )
    .join("\n");

  const factorLines = factors.map((f) => `- ${f.label}: ${f.value} (${f.effect})`).join("\n");
  const trendLine = trend
    ? `Recent performance trend: ${trend.direction} ${trend.changePercent > 0 ? "+" : ""}${trend.changePercent}% vs. the prior period.`
    : "Not enough dated history yet to compute a trend.";

  return `Student: ${name}

Pre-computed evidence (treat as ground truth):
${factorLines || "No evidence available yet."}
${trendLine}

Per-subject breakdown:
${subjectLines || "No subject data yet."}

Overall attendance: ${s.attendanceRate ?? "N/A"}% (${s.attendancePresent}/${s.attendanceTotal} sessions)
Recent submissions: ${JSON.stringify(s.recentSubmissions.slice(0, 5))}
Recent exam grades: ${JSON.stringify(s.recentGrades.slice(0, 5))}

Analyze this student's performance and respond with the JSON described in the system prompt.`;
}

// Used when ANTHROPIC_API_KEY isn't configured, or the AI call/parse fails.
// Still computed from the real aggregated numbers — just rule-based instead of LLM-generated.
function ruleBasedJudgment(studentName: string, s: StudentPerformanceSummary, factors: Factor[], trend: Trend | null): Judgment {
  const overallAvg = avgOf([s.overallAssignmentAvgPercent, s.overallExamAvgPercent]);
  const attendance = s.attendanceRate;

  let riskLevel: Judgment["riskLevel"] = "low";
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

  // Cause-and-effect framing: lead with the worst negative factor(s) by name, like the AI path does.
  const negativeFactors = factors.filter((f) => f.effect === "negative");
  const trendClause =
    trend && trend.direction === "down" ? ` Performance has also declined ${Math.abs(trend.changePercent)}% recently.` : "";
  const first = studentName.trim().split(/\s+/)[0] || studentName;

  let summary: string;
  if (negativeFactors.length >= 2) {
    const [a, b] = negativeFactors;
    summary = `${first} is at ${riskLevel} risk primarily because ${a.label.toLowerCase()} is at ${a.value} while ${b.label.toLowerCase()} sits at ${b.value}.${trendClause}`;
  } else if (negativeFactors.length === 1) {
    summary = `${first} is at ${riskLevel} risk primarily because ${negativeFactors[0].label.toLowerCase()} is at ${negativeFactors[0].value}.${trendClause}`;
  } else {
    summary = `${first}'s overall performance is solid across all subjects.${trendClause}`;
  }

  return { riskLevel, weakSubjects, recommendations: recommendations.slice(0, 5), summary };
}

function avgOf(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n != null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}
