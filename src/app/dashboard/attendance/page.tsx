import { CalendarCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAllClassesForManagement, getEnrolledClasses, getTeacherClasses } from "@/lib/data/academics";
import { getProfilesMap } from "@/lib/data/profiles";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AttendanceControls } from "@/components/dashboard/attendance-controls";
import { AttendanceMarker } from "@/components/dashboard/attendance-marker";
import { formatDate } from "@/lib/format";
import type { AttendanceStatus } from "@/types/database";

export const metadata = { title: "Attendance" };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; date?: string }>;
}) {
  const { id, profile } = await requireUser();
  const { classId: classIdParam, date: dateParam } = await searchParams;
  const supabase = await createClient();

  if (profile.role === "teacher" || profile.role === "admin") {
    const classes =
      profile.role === "admin" ? await getAllClassesForManagement(supabase) : await getTeacherClasses(supabase, id);
    if (classes.length === 0) {
      return <EmptyState icon={CalendarCheck} title="No classes yet" description="Create a class from the Admin console." />;
    }

    const classId = classIdParam && classes.some((c) => c.classId === classIdParam) ? classIdParam : classes[0].classId;
    const sessionDate = dateParam ?? new Date().toISOString().slice(0, 10);

    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("class_id", classId)
      .eq("status", "active");
    const studentIds = (enrollments ?? []).map((e) => e.student_id);
    const profileMap = await getProfilesMap(supabase, studentIds);
    const roster = studentIds
      .map((sid) => profileMap.get(sid))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({ id: p.id, full_name: p.full_name }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name));

    const { data: existing } = studentIds.length
      ? await supabase
          .from("attendance")
          .select("student_id, status")
          .eq("class_id", classId)
          .eq("session_date", sessionDate)
          .in("student_id", studentIds)
      : { data: [] as { student_id: string; status: AttendanceStatus }[] };

    const initialStatuses = Object.fromEntries((existing ?? []).map((e) => [e.student_id, e.status]));

    return (
      <div className="space-y-6">
        <AttendanceControls classes={classes} classId={classId} date={sessionDate} />
        <Card>
          <CardContent>
            <AttendanceMarker classId={classId} sessionDate={sessionDate} roster={roster} initialStatuses={initialStatuses} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Student view
  const classes = await getEnrolledClasses(supabase, id);
  if (classes.length === 0) {
    return <EmptyState icon={CalendarCheck} title="No attendance yet" description="Enroll in a course to start tracking attendance." />;
  }

  const classIds = classes.map((c) => c.classId);
  const { data: records } = await supabase
    .from("attendance")
    .select("*")
    .in("class_id", classIds)
    .eq("student_id", id)
    .order("session_date", { ascending: false });

  return (
    <div className="space-y-6">
      {classes.map((c) => {
        const classRecords = (records ?? []).filter((r) => r.class_id === c.classId);
        const present = classRecords.filter((r) => r.status === "present" || r.status === "late").length;
        const rate = classRecords.length ? Math.round((present / classRecords.length) * 100) : null;

        return (
          <Card key={c.classId}>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.courseTitle}</p>
                  <p className="text-sm text-muted-foreground">{c.className}</p>
                </div>
                <span className="text-2xl font-semibold">{rate != null ? `${rate}%` : "—"}</span>
              </div>
              {rate != null && <Progress value={rate} />}

              {classRecords.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {classRecords.slice(0, 14).map((r) => (
                    <Badge
                      key={r.id}
                      variant="outline"
                      className={
                        r.status === "present"
                          ? "border-success/40 bg-success/10 text-success"
                          : r.status === "late"
                            ? "border-warning/40 bg-warning/10 text-warning"
                            : r.status === "excused"
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-danger/40 bg-danger/10 text-danger"
                      }
                    >
                      {formatDate(r.session_date)} · {r.status}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
