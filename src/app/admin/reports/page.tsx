import { BookOpen, FileBarChart, Percent, Users2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAllClassesForManagement, getClassPerformanceSummary } from "@/lib/data/academics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatTile } from "@/components/dashboard/stat-tile";
import { DownloadClassReportButton } from "@/components/shared/download-class-report-button";

export const metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const classes = await getAllClassesForManagement(supabase);

  if (classes.length === 0) {
    return <EmptyState icon={FileBarChart} title="No classes yet" description="System-wide reports will appear once classes exist." />;
  }

  const perf = await Promise.all(classes.map((c) => getClassPerformanceSummary(supabase, c.classId)));
  const perfByClass = new Map(perf.map((p) => [p.classId, p]));

  const rows = classes.map((c) => {
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

  const withAttendance = rows.filter((r) => r.avgAttendance != null);
  const avgAttendanceAll = withAttendance.length
    ? Math.round((withAttendance.reduce((a, r) => a + (r.avgAttendance ?? 0), 0) / withAttendance.length) * 10) / 10
    : null;
  const totalStudents = rows.reduce((a, r) => a + r.studentCount, 0);
  const totalAtRisk = rows.reduce((a, r) => a + r.atRiskCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">System-wide performance</h2>
        <DownloadClassReportButton
          data={{ title: "EduPortal — System Performance Report", generatedAt: new Date().toISOString(), rows }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={Users2} label="Total enrolled" value={String(totalStudents)} />
        <StatTile icon={Percent} label="Avg attendance" value={avgAttendanceAll != null ? `${avgAttendanceAll}%` : "—"} />
        <StatTile icon={BookOpen} label="Students at risk" value={String(totalAtRisk)} accent />
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
            {rows.map((r) => (
              <TableRow key={r.className + r.courseTitle}>
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
