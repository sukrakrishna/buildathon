import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeacherClasses } from "@/lib/data/academics";
import { getProfilesMap } from "@/lib/data/profiles";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { RiskBadge } from "@/components/ai/risk-badge";
import { StudentInsightDialog } from "@/components/dashboard/student-insight-dialog";
import { initials } from "@/lib/format";
import type { RiskLevel } from "@/types/database";

export const metadata = { title: "Students" };

export default async function TeacherStudentsPage() {
  const { id, profile } = await requireUser();
  if (profile.role !== "teacher") redirect("/dashboard");

  const supabase = await createClient();
  const classes = await getTeacherClasses(supabase, id);
  const classIds = classes.map((c) => c.classId);
  const classMap = new Map(classes.map((c) => [c.classId, c.courseTitle]));

  if (classIds.length === 0) {
    return <EmptyState icon={Users} title="No classes assigned" description="Ask an admin to assign you to a class." />;
  }

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id, class_id")
    .in("class_id", classIds)
    .eq("status", "active");

  const studentIds = [...new Set((enrollments ?? []).map((e) => e.student_id))];
  const profileMap = await getProfilesMap(supabase, studentIds);

  const coursesByStudent = new Map<string, Set<string>>();
  for (const e of enrollments ?? []) {
    const set = coursesByStudent.get(e.student_id) ?? new Set<string>();
    set.add(classMap.get(e.class_id) ?? "Unknown");
    coursesByStudent.set(e.student_id, set);
  }

  const { data: insights } = studentIds.length
    ? await supabase
        .from("ai_insights")
        .select("student_id, risk_level, generated_at")
        .in("student_id", studentIds)
        .order("generated_at", { ascending: false })
    : { data: [] as { student_id: string; risk_level: RiskLevel; generated_at: string }[] };

  const latestRiskByStudent = new Map<string, RiskLevel>();
  for (const i of insights ?? []) {
    if (!latestRiskByStudent.has(i.student_id)) latestRiskByStudent.set(i.student_id, i.risk_level);
  }

  const rows = studentIds
    .map((sid) => ({
      id: sid,
      name: profileMap.get(sid)?.full_name ?? "Student",
      courses: [...(coursesByStudent.get(sid) ?? [])].join(", "),
      risk: latestRiskByStudent.get(sid) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (rows.length === 0) {
    return <EmptyState icon={Users} title="No students enrolled yet" description="Once students enroll in your classes, they'll show up here." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Courses</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead className="text-right">AI Insight</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials(row.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{row.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{row.courses}</TableCell>
              <TableCell>{row.risk ? <RiskBadge level={row.risk} /> : <span className="text-xs text-muted-foreground">Not analyzed</span>}</TableCell>
              <TableCell className="text-right">
                <StudentInsightDialog studentId={row.id} studentName={row.name} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
