import type { InsightData } from "@/components/ai/insight-panel";
import type { Factor, Trend } from "@/lib/ai/evidence";
import type { RiskLevel } from "@/types/database";

// Shared mapper from a raw `ai_insights` row (as fetched server-side) into
// the shape the Risk Center panel renders. Lives outside insight-panel.tsx
// (a "use client" file) because Next.js treats every export of a client
// module as a client reference — a plain pure function like this one can't
// be called from a Server Component if it's co-located there.
export function toInsightData(row: {
  id: string;
  risk_level: RiskLevel;
  weak_subjects: string[];
  recommendations: string[];
  summary: string | null;
  generated_at: string;
  raw_response: unknown;
}): InsightData {
  const raw = (row.raw_response ?? {}) as { source?: "ai" | "fallback"; confidence?: number; factors?: Factor[]; trend?: Trend | null };
  return {
    insightId: row.id,
    riskLevel: row.risk_level,
    weakSubjects: row.weak_subjects,
    recommendations: row.recommendations,
    summary: row.summary ?? "",
    generatedAt: row.generated_at,
    source: raw.source,
    confidence: raw.confidence ?? 50,
    factors: raw.factors ?? [],
    trend: raw.trend ?? null,
  };
}
