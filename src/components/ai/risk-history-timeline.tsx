import { TrendingDown, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InsightHistoryEntry } from "@/lib/data/academics";

const DOT_CLASS: Record<InsightHistoryEntry["riskLevel"], string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-danger",
};

const RANK: Record<InsightHistoryEntry["riskLevel"], number> = { low: 0, medium: 1, high: 2 };

export function RiskHistoryTimeline({ entries }: { entries: InsightHistoryEntry[] }) {
  if (entries.length < 2) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
        Generate insights over time to build a risk history.
      </div>
    );
  }

  const first = entries[0];
  const last = entries[entries.length - 1];
  const delta = RANK[last.riskLevel] - RANK[first.riskLevel];

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {entries.map((e, i) => (
          <div key={e.id} className="flex shrink-0 flex-col items-center gap-1">
            <span className={cn("size-3 rounded-full", DOT_CLASS[e.riskLevel])} />
            <span className="text-[10px] text-muted-foreground">{formatDate(e.generatedAt, { month: "short", day: "numeric" })}</span>
            {i < entries.length - 1 && <span className="sr-only">then</span>}
          </div>
        ))}
      </div>
      {delta !== 0 && (
        <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", delta > 0 ? "text-danger" : "text-success")}>
          {delta > 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
          Risk {delta > 0 ? "increased" : "decreased"} over the last {entries.length} check-ins.
        </p>
      )}
    </div>
  );
}
