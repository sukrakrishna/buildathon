import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, ClipboardList, GraduationCap, Sparkles, TrendingUp, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getEnrolledClasses, getStudentPerformanceSummary, getTeacherClasses } from "@/lib/data/academics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatTile } from "@/components/dashboard/stat-tile";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Dashboard" };

export default async function DashboardOverviewPage() {
  const { id, profile } = await requireUser();
  if (profile.role === "admin") redirect("/admin");
  const supabase = await createClient();

  if (profile.role === "teacher") return <TeacherOverview teacherId={id} name={profile.full_name} />;

  const [classes, summary] = await Promise.all([
    getEnrolledClasses(supabase, id),
    getStudentPerformanceSummary(supabase, id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Welcome back, {profile.full_name.split(" ")[0]}</h2>
        <p className="text-muted-foreground">Here's how you're doing across your courses.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={CalendarCheck}
          label="Attendance"
          value={summary.attendanceRate != null ? `${summary.attendanceRate}%` : "—"}
        />
        <StatTile
          icon={ClipboardList}
          label="Assignment avg"
          value={summary.overallAssignmentAvgPercent != null ? `${summary.overallAssignmentAvgPercent}%` : "—"}
        />
        <StatTile
          icon={GraduationCap}
          label="Exam avg"
          value={summary.overallExamAvgPercent != null ? `${summary.overallExamAvgPercent}%` : "—"}
        />
        <StatTile icon={Users} label="Enrolled courses" value={String(classes.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="mb-3 font-semibold">My courses</h3>
          {classes.length > 0 ? (
            <div className="space-y-3">
              {classes.map((c) => (
                <Card key={c.classId}>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.courseTitle}</p>
                      <p className="text-sm text-muted-foreground">{c.className}</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No courses yet"
              description="Enroll in a course from the catalog to get started."
              action={
                <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
                  Browse courses
                </Link>
              }
            />
          )}
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-1.5 font-semibold">
            <Sparkles className="size-4 text-ai" /> AI recommendations
          </h3>
          <Link href="/dashboard/progress" className="block">
            <div className="ai-gradient-border rounded-xl p-5 transition-shadow hover:shadow-md">
              <p className="text-sm text-muted-foreground">
                See your personalized weak-subject breakdown and study recommendations, generated from your
                real attendance, assignment, and exam data.
              </p>
              <p className="mt-3 flex items-center gap-1 text-sm font-medium text-ai">
                <TrendingUp className="size-3.5" /> View My Progress
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

async function TeacherOverview({ teacherId, name }: { teacherId: string; name: string }) {
  const supabase = await createClient();
  const classes = await getTeacherClasses(supabase, teacherId);
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);

  const classIds = classes.map((c) => c.classId);
  const { data: pendingSubmissions } = classIds.length
    ? await supabase
        .from("assignments")
        .select("id")
        .in("class_id", classIds)
    : { data: [] as { id: string }[] };

  const assignmentIds = (pendingSubmissions ?? []).map((a) => a.id);
  const { data: ungraded } = assignmentIds.length
    ? await supabase.from("submissions").select("id").in("assignment_id", assignmentIds).is("score", null)
    : { data: [] as { id: string }[] };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Welcome back, {name.split(" ")[0]}</h2>
        <p className="text-muted-foreground">Here's an overview of your classes.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={Users} label="Classes" value={String(classes.length)} />
        <StatTile icon={GraduationCap} label="Total students" value={String(totalStudents)} />
        <StatTile icon={ClipboardList} label="Ungraded submissions" value={String(ungraded?.length ?? 0)} />
      </div>

      <div>
        <h3 className="mb-3 font-semibold">My classes</h3>
        {classes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <Card key={c.classId}>
                <CardContent className="space-y-1.5">
                  <p className="font-medium">{c.courseTitle}</p>
                  <p className="text-sm text-muted-foreground">{c.className}</p>
                  <p className="text-xs text-muted-foreground">{c.studentCount} students</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No classes assigned yet"
            description="Ask an admin to assign you to a class from the Admin console."
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Last updated {formatDate(new Date())}
      </p>
    </div>
  );
}
