import { CheckCircle2, Sparkles, TriangleAlert, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfilesMap } from "@/lib/data/profiles";
import { StatTile } from "@/components/dashboard/stat-tile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { RiskBadge } from "@/components/ai/risk-badge";
import { StudentInsightDialog } from "@/components/dashboard/student-insight-dialog";
import { formatDateTime } from "@/lib/format";
import type { RiskLevel } from "@/types/database";

export const metadata = { title: "AI Monitoring" };

export default async function AiMonitoringPage() {
  const supabase = await createClient();

  const { data: insights } = await supabase
    .from("ai_insights")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(500);

  const latestByStudent = new Map<
    string,
    { risk_level: RiskLevel; summary: string | null; weak_subjects: string[]; generated_at: string }
  >();
  for (const i of insights ?? []) {
    if (!latestByStudent.has(i.student_id)) {
      latestByStudent.set(i.student_id, {
        risk_level: i.risk_level,
        summary: i.summary,
        weak_subjects: i.weak_subjects,
        generated_at: i.generated_at,
      });
    }
  }

  const profileMap = await getProfilesMap(supabase, [...latestByStudent.keys()]);

  const counts = { low: 0, medium: 0, high: 0 };
  for (const v of latestByStudent.values()) counts[v.risk_level] += 1;

  const rows = [...latestByStudent.entries()]
    .filter(([, v]) => v.risk_level !== "low")
    .sort((a, b) => (a[1].risk_level === b[1].risk_level ? 0 : a[1].risk_level === "high" ? -1 : 1));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={CheckCircle2} label="On track" value={String(counts.low)} />
        <StatTile icon={TriangleAlert} label="Needs attention" value={String(counts.medium)} />
        <StatTile icon={AlertTriangle} label="At risk" value={String(counts.high)} accent />
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-1.5 font-semibold">
          <Sparkles className="size-4 text-ai" /> Students flagged by the AI engine
        </h3>
        {rows.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Weak subjects</TableHead>
                  <TableHead>Last analyzed</TableHead>
                  <TableHead className="text-right">Insight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(([sid, v]) => (
                  <TableRow key={sid}>
                    <TableCell className="font-medium">{profileMap.get(sid)?.full_name ?? "Student"}</TableCell>
                    <TableCell><RiskBadge level={v.risk_level} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.weak_subjects.join(", ") || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(v.generated_at)}</TableCell>
                    <TableCell className="text-right">
                      <StudentInsightDialog studentId={sid} studentName={profileMap.get(sid)?.full_name ?? "Student"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No at-risk students"
            description="Once students generate AI insights from their progress page, anyone flagged medium or high risk will show up here."
          />
        )}
      </div>
    </div>
  );
}
