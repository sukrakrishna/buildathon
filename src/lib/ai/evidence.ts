import type { StudentPerformanceSummary } from "@/lib/data/academics";

// Deterministic, computed-from-real-data evidence — never AI-generated. The
// model only ever writes the narrative summary/recommendations; the numbers
// backing the "why" are always trustworthy math over stored records.

export interface Factor {
  label: string;
  value: string;
  effect: "positive" | "neutral" | "negative";
}

export interface Trend {
  direction: "up" | "down" | "flat";
  changePercent: number;
}

function effectOf(percent: number): Factor["effect"] {
  if (percent < 70) return "negative";
  if (percent < 85) return "neutral";
  return "positive";
}

export function computeFactors(summary: StudentPerformanceSummary): Factor[] {
  const factors: Factor[] = [];

  if (summary.attendanceRate != null) {
    factors.push({ label: "Attendance", value: `${summary.attendanceRate}%`, effect: effectOf(summary.attendanceRate) });
  }
  if (summary.overallAssignmentAvgPercent != null) {
    factors.push({
      label: "Assignment completion",
      value: `${summary.overallAssignmentAvgPercent}%`,
      effect: effectOf(summary.overallAssignmentAvgPercent),
    });
  }
  if (summary.overallExamAvgPercent != null) {
    factors.push({
      label: "Exam average",
      value: `${summary.overallExamAvgPercent}%`,
      effect: effectOf(summary.overallExamAvgPercent),
    });
  }

  // Surface subject-specific factors that diverge meaningfully from the
  // overall averages above — this is what lets a "mixed" student (strong in
  // one subject, weak in another) show up correctly instead of averaging out.
  const overallBaseline =
    ((summary.overallAssignmentAvgPercent ?? 0) + (summary.overallExamAvgPercent ?? 0)) /
    (summary.overallAssignmentAvgPercent != null && summary.overallExamAvgPercent != null ? 2 : 1);

  const subjectFactors = summary.subjects
    .map((s) => {
      const vals = [s.assignmentAvgPercent, s.examAvgPercent].filter((v): v is number => v != null);
      if (vals.length === 0) return null;
      const combined = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      return { subject: s.subject, combined, divergence: Math.abs(combined - overallBaseline) };
    })
    .filter((s): s is { subject: string; combined: number; divergence: number } => s !== null)
    .sort((a, b) => b.divergence - a.divergence)
    .slice(0, 2);

  for (const s of subjectFactors) {
    if (s.divergence < 8) continue; // not different enough from the overall to be a distinct signal
    factors.push({ label: `${s.subject} average`, value: `${s.combined}%`, effect: effectOf(s.combined) });
  }

  return factors.slice(0, 6);
}

export function computeTrend(summary: StudentPerformanceSummary): Trend | null {
  const dated = [
    ...summary.recentSubmissions
      .filter((s) => s.scorePercent != null)
      .map((s) => ({ date: s.submittedAt, pct: s.scorePercent as number })),
    ...summary.recentGrades
      .filter((g) => g.examDate != null)
      .map((g) => ({ date: g.examDate as string, pct: g.scorePercent })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (dated.length < 4) return null;

  const mid = Math.floor(dated.length / 2);
  const older = dated.slice(0, mid);
  const recent = dated.slice(mid);
  const avg = (arr: { pct: number }[]) => arr.reduce((a, b) => a + b.pct, 0) / arr.length;

  const changePercent = Math.round(avg(recent) - avg(older));
  const direction: Trend["direction"] = changePercent > 3 ? "up" : changePercent < -3 ? "down" : "flat";

  return { direction, changePercent };
}

export function computeConfidence(summary: StudentPerformanceSummary): number {
  const dataPoints = summary.attendanceTotal + summary.recentSubmissions.length + summary.recentGrades.length;
  return Math.max(40, Math.min(95, 40 + dataPoints * 3));
}
