import { redirect } from "next/navigation";
import { CalendarCheck, ClipboardList, GraduationCap, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getInsightHistory, getStudentPerformanceSummary } from "@/lib/data/academics";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatTile } from "@/components/dashboard/stat-tile";
import { SubjectPerformanceChart } from "@/components/dashboard/subject-performance-chart";
import { InsightPanel } from "@/components/ai/insight-panel";
import { toInsightData } from "@/lib/ai/insight-mapper";
import { RiskHistoryTimeline } from "@/components/ai/risk-history-timeline";

export const metadata = { title: "My Progress" };

export default async function ProgressPage() {
  const { id, profile } = await requireUser();
  if (profile.role !== "student") redirect("/dashboard");

  const supabase = await createClient();
  const summary = await getStudentPerformanceSummary(supabase, id);

  const [{ data: latestInsight }, history] = await Promise.all([
    supabase.from("ai_insights").select("*").eq("student_id", id).order("generated_at", { ascending: false }).limit(1).maybeSingle(),
    getInsightHistory(supabase, id),
  ]);

  const initialInsight = latestInsight ? toInsightData(latestInsight) : null;

  if (summary.subjects.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Not enough data yet"
        description="Enroll in a course and complete some assignments or exams to see your progress here."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={CalendarCheck}
          label="Attendance"
          value={summary.attendanceRate != null ? `${summary.attendanceRate}%` : "—"}
          hint={`${summary.attendancePresent}/${summary.attendanceTotal} sessions`}
        />
        <StatTile
          icon={ClipboardList}
          label="Assignment average"
          value={summary.overallAssignmentAvgPercent != null ? `${summary.overallAssignmentAvgPercent}%` : "—"}
        />
        <StatTile
          icon={GraduationCap}
          label="Exam average"
          value={summary.overallExamAvgPercent != null ? `${summary.overallExamAvgPercent}%` : "—"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardContent>
            <h3 className="mb-1 font-semibold">Performance by subject</h3>
            <p className="mb-4 text-sm text-muted-foreground">Attendance, assignment, and exam averages per course.</p>
            <SubjectPerformanceChart subjects={summary.subjects} />
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Attendance</TableHead>
                    <TableHead className="text-right">Assignments</TableHead>
                    <TableHead className="text-right">Exams</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.subjects.map((s) => (
                    <TableRow key={s.classId}>
                      <TableCell className="font-medium">{s.subject}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.attendanceRate ?? "—"}%</TableCell>
                      <TableCell className="text-right tabular-nums">{s.assignmentAvgPercent ?? "—"}%</TableCell>
                      <TableCell className="text-right tabular-nums">{s.examAvgPercent ?? "—"}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <InsightPanel studentId={id} studentName={profile.full_name} initialInsight={initialInsight} />
          <RiskHistoryTimeline entries={history} />
        </div>
      </div>
    </div>
  );
}
