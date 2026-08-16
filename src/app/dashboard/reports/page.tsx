import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStudentPerformanceSummary, getTeacherClasses, getClassPerformanceSummary } from "@/lib/data/academics";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatTile } from "@/components/dashboard/stat-tile";
import { InsightPanel, type InsightData } from "@/components/ai/insight-panel";
import { DownloadStudentReportButton } from "@/components/shared/download-student-report-button";
import { DownloadClassReportButton } from "@/components/shared/download-class-report-button";
import { CalendarCheck, ClipboardList, FileBarChart, GraduationCap } from "lucide-react";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const { id, profile } = await requireUser();
  const supabase = await createClient();

  if (profile.role === "teacher") {
    const classes = await getTeacherClasses(supabase, id);
    if (classes.length === 0) {
      return <EmptyState icon={FileBarChart} title="No classes yet" description="Reports will appear once you have classes." />;
    }

    const perf = await Promise.all(classes.map((c) => getClassPerformanceSummary(supabase, c.classId)));
    const perfByClass = new Map(perf.map((p) => [p.classId, p]));

    const reportRows = classes.map((c) => {
      const p = perfByClass.get(c.classId)!;
      return {
        className: c.className,
        courseTitle: c.courseTitle,
        studentCount: p.studentCount,
        avgAttendance: p.avgAttendance,
        avgAssignment: p.avgAssignment,
        avgExam: p.avgExam,
        atRiskCount: p.atRiskCount,
      };
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Class performance comparison</h2>
          <DownloadClassReportButton
            data={{ title: `${profile.full_name} — Class Performance Report`, generatedAt: new Date().toISOString(), rows: reportRows }}
          />
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Avg attendance</TableHead>
                <TableHead className="text-right">Avg assignment</TableHead>
                <TableHead className="text-right">Avg exam</TableHead>
                <TableHead className="text-right">At risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportRows.map((r) => (
                <TableRow key={r.className}>
                  <TableCell className="font-medium">{r.className}</TableCell>
                  <TableCell className="text-muted-foreground">{r.courseTitle}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.studentCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.avgAttendance ?? "—"}%</TableCell>
                  <TableCell className="text-right tabular-nums">{r.avgAssignment ?? "—"}%</TableCell>
                  <TableCell className="text-right tabular-nums">{r.avgExam ?? "—"}%</TableCell>
                  <TableCell className="text-right tabular-nums">{r.atRiskCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Student view
  const summary = await getStudentPerformanceSummary(supabase, id);
  const { data: latestInsight } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("student_id", id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const initialInsight: InsightData | null = latestInsight
    ? {
        riskLevel: latestInsight.risk_level,
        weakSubjects: latestInsight.weak_subjects,
        recommendations: latestInsight.recommendations,
        summary: latestInsight.summary ?? "",
        generatedAt: latestInsight.generated_at,
      }
    : null;

  if (summary.subjects.length === 0) {
    return <EmptyState icon={FileBarChart} title="Nothing to report yet" description="Enroll in a course to generate your first report." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Academic performance summary</h2>
        <DownloadStudentReportButton
          data={{
            studentName: profile.full_name,
            generatedAt: new Date().toISOString(),
            attendanceRate: summary.attendanceRate,
            attendancePresent: summary.attendancePresent,
            attendanceTotal: summary.attendanceTotal,
            overallAssignmentAvgPercent: summary.overallAssignmentAvgPercent,
            overallExamAvgPercent: summary.overallExamAvgPercent,
            subjects: summary.subjects,
            insight: initialInsight
              ? {
                  riskLevel: initialInsight.riskLevel,
                  summary: initialInsight.summary,
                  weakSubjects: initialInsight.weakSubjects,
                  recommendations: initialInsight.recommendations,
                }
              : null,
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={CalendarCheck} label="Attendance" value={summary.attendanceRate != null ? `${summary.attendanceRate}%` : "—"} />
        <StatTile icon={ClipboardList} label="Assignment avg" value={summary.overallAssignmentAvgPercent != null ? `${summary.overallAssignmentAvgPercent}%` : "—"} />
        <StatTile icon={GraduationCap} label="Exam avg" value={summary.overallExamAvgPercent != null ? `${summary.overallExamAvgPercent}%` : "—"} />
      </div>

      <Card>
        <CardContent>
          <h3 className="mb-4 font-semibold">By subject</h3>
          <div className="overflow-x-auto">
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

      <InsightPanel initialInsight={initialInsight} canRegenerate={false} />
    </div>
  );
}
