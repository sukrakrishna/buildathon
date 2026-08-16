import { AlertTriangle, CheckCircle2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RISK_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/database";

const CONFIG: Record<RiskLevel, { icon: typeof CheckCircle2; className: string }> = {
  low: { icon: CheckCircle2, className: "border-success/40 bg-success/10 text-success" },
  medium: { icon: TriangleAlert, className: "border-warning/40 bg-warning/10 text-warning" },
  high: { icon: AlertTriangle, className: "border-danger/40 bg-danger/10 text-danger" },
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const cfg = CONFIG[level];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn(cfg.className, "gap-1 font-medium", className)}>
      <Icon className="size-3.5" />
      {RISK_LABEL[level]}
    </Badge>
  );
}
