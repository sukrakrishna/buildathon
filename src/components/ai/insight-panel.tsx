"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, ShieldAlert, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/ai/risk-badge";
import { InterventionPlanCard } from "@/components/ai/intervention-plan-card";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/database";
import type { Factor, Trend } from "@/lib/ai/evidence";

export interface InsightData {
  insightId?: string | null;
  riskLevel: RiskLevel;
  weakSubjects: string[];
  recommendations: string[];
  summary: string;
  confidence: number;
  factors: Factor[];
  trend: Trend | null;
  source?: "ai" | "fallback";
  generatedAt: string;
}

const EFFECT_DOT: Record<Factor["effect"], string> = {
  positive: "bg-success",
  neutral: "bg-warning",
  negative: "bg-danger",
};

export function InsightPanel({
  studentId,
  studentName,
  initialInsight,
  canRegenerate = true,
}: {
  studentId: string;
  studentName: string;
  initialInsight: InsightData | null;
  canRegenerate?: boolean;
}) {
  const [insight, setInsight] = useState<InsightData | null>(initialInsight);
  const [loading, setLoading] = useState(!initialInsight && canRegenerate);

  async function fetchInsight() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body.error ?? "Failed to generate insight");
      }
      const data = (await res.json()) as InsightData;
      setInsight(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate insight");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialInsight && canRegenerate) fetchInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !insight) {
    return (
      <div className="ai-gradient-border space-y-3 rounded-2xl p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="ai-gradient-border rounded-2xl p-6 text-center">
        <p className="text-sm text-muted-foreground">No insight generated yet.</p>
        {canRegenerate && (
          <Button size="sm" className="mt-3" onClick={fetchInsight}>
            <Sparkles /> Generate insight
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="ai-gradient-border rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-ai/15 text-ai">
            <Sparkles className="size-4" />
          </span>
          <span className="font-semibold">AI Risk Center</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{insight.confidence}% confidence</span>
          <RiskBadge level={insight.riskLevel} />
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed">{insight.summary}</p>

      {insight.trend && (
        <p
          className={cn(
            "mt-2 flex items-center gap-1.5 text-xs font-medium",
            insight.trend.direction === "down" ? "text-danger" : insight.trend.direction === "up" ? "text-success" : "text-muted-foreground"
          )}
        >
          {insight.trend.direction === "down" ? (
            <TrendingDown className="size-3.5" />
          ) : insight.trend.direction === "up" ? (
            <TrendingUp className="size-3.5" />
          ) : null}
          Recent performance {insight.trend.direction === "flat" ? "steady" : `${insight.trend.changePercent > 0 ? "+" : ""}${insight.trend.changePercent}%`} vs. the prior period
        </p>
      )}

      {insight.factors.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence</p>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <tbody>
                {insight.factors.map((f) => (
                  <tr key={f.label} className="border-b last:border-b-0">
                    <td className="px-3 py-1.5 text-muted-foreground">{f.label}</td>
                    <td className="px-3 py-1.5 text-right font-medium tabular-nums">{f.value}</td>
                    <td className="w-8 px-3 py-1.5">
                      <span className={cn("mx-auto block size-2 rounded-full", EFFECT_DOT[f.effect])} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {insight.weakSubjects.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Weak subjects</p>
          <div className="flex flex-wrap gap-1.5">
            {insight.weakSubjects.map((s) => (
              <Badge key={s} variant="outline" className="border-danger/30 text-danger">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {insight.recommendations.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommendations</p>
          <ul className="space-y-1.5">
            {insight.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="mt-0.5 text-ai">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <InterventionPlanCard
        studentId={studentId}
        studentName={studentName}
        riskLevel={insight.riskLevel}
        weakSubjects={insight.weakSubjects}
        summary={insight.summary}
        recommendations={insight.recommendations}
        insightId={insight.insightId ?? null}
        canManage={canRegenerate}
      />

      <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
        Early-warning signal, not a final judgment — AI recommendations are based on academic indicators and should be reviewed by educators before intervention.
      </p>

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">
          {insight.source === "ai" ? "Generated by Claude" : "Rule-based analysis"} · {formatDateTime(insight.generatedAt)}
        </span>
        {canRegenerate && (
          <Button size="sm" variant="ghost" onClick={fetchInsight} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Regenerate
          </Button>
        )}
      </div>
    </div>
  );
}
