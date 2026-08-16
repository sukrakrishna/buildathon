import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAllClassesForManagement, getEnrolledClasses, getTeacherClasses } from "@/lib/data/academics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ClassPicker } from "@/components/dashboard/class-picker";
import { CreateAssignmentDialog } from "@/components/dashboard/create-assignment-dialog";
import { formatDate, scoreToPercent } from "@/lib/format";
import type { Database } from "@/types/database";

export const metadata = { title: "Assignments" };

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const { id, profile } = await requireUser();
  const { classId: classIdParam } = await searchParams;
  const supabase = await createClient();

  if (profile.role === "teacher" || profile.role === "admin") {
    const classes =
      profile.role === "admin" ? await getAllClassesForManagement(supabase) : await getTeacherClasses(supabase, id);
    if (classes.length === 0) {
      return <EmptyState icon={ClipboardList} title="No classes yet" description="Create a class from the Admin console." />;
    }
    const classId = classIdParam && classes.some((c) => c.classId === classIdParam) ? classIdParam : classes[0].classId;

    const { data: assignments } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", classId)
      .order("due_date", { ascending: true });

    const assignmentIds = (assignments ?? []).map((a) => a.id);
    const { data: submissions } = assignmentIds.length
      ? await supabase.from("submissions").select("assignment_id, score").in("assignment_id", assignmentIds)
      : { data: [] as { assignment_id: string; score: number | null }[] };

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ClassPicker classes={classes} value={classId} />
          <CreateAssignmentDialog classId={classId} />
        </div>

        {assignments && assignments.length > 0 ? (
          <div className="space-y-3">
            {assignments.map((a) => {
              const subs = (submissions ?? []).filter((s) => s.assignment_id === a.id);
              const graded = subs.filter((s) => s.score != null).length;
              return (
                <Link key={a.id} href={`/dashboard/assignments/${a.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <p className="text-sm text-muted-foreground">Due {formatDate(a.due_date)}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{subs.length} submitted</span>
                        <Badge variant="secondary">{graded}/{subs.length} graded</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="No assignments yet" description="Create one to get started." />
        )}
      </div>
    );
  }

  // Student view
  const classes = await getEnrolledClasses(supabase, id);
  const classIds = classes.map((c) => c.classId);
  const classMap = new Map(classes.map((c) => [c.classId, c]));

  const { data: assignments } = classIds.length
    ? await supabase.from("assignments").select("*").in("class_id", classIds).order("due_date", { ascending: true })
    : { data: [] as Database["public"]["Tables"]["assignments"]["Row"][] };

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: submissions } = assignmentIds.length
    ? await supabase.from("submissions").select("*").in("assignment_id", assignmentIds).eq("student_id", id)
    : { data: [] as { assignment_id: string; score: number | null; status: string }[] };
  const submissionMap = new Map((submissions ?? []).map((s) => [s.assignment_id, s]));

  return (
    <div className="space-y-3">
      {assignments && assignments.length > 0 ? (
        assignments.map((a) => {
          const submission = submissionMap.get(a.id);
          const pct = submission ? scoreToPercent(submission.score, Number(a.max_score)) : null;
          return (
            <Link key={a.id} href={`/dashboard/assignments/${a.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {classMap.get(a.class_id)?.courseTitle} · Due {formatDate(a.due_date)}
                    </p>
                  </div>
                  {submission ? (
                    pct != null ? (
                      <Badge className="border-success/40 bg-success/10 text-success">{pct}%</Badge>
                    ) : (
                      <Badge variant="secondary" className="capitalize">{submission.status}</Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="border-danger/40 text-danger">Not submitted</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })
      ) : (
        <EmptyState icon={ClipboardList} title="No assignments yet" description="Assignments from your courses will show up here." />
      )}
    </div>
  );
}
