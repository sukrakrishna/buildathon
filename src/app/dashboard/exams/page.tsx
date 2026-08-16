import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAllClassesForManagement, getEnrolledClasses, getTeacherClasses } from "@/lib/data/academics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ClassPicker } from "@/components/dashboard/class-picker";
import { CreateExamDialog } from "@/components/dashboard/create-exam-dialog";
import { formatDate, scoreToPercent } from "@/lib/format";
import type { Database } from "@/types/database";

export const metadata = { title: "Exams & Grades" };

export default async function ExamsPage({
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
      return <EmptyState icon={GraduationCap} title="No classes yet" description="Create a class from the Admin console." />;
    }
    const classId = classIdParam && classes.some((c) => c.classId === classIdParam) ? classIdParam : classes[0].classId;
    const currentClass = classes.find((c) => c.classId === classId)!;

    const { data: exams } = await supabase.from("exams").select("*").eq("class_id", classId).order("exam_date", { ascending: true });
    const examIds = (exams ?? []).map((e) => e.id);
    const { data: grades } = examIds.length
      ? await supabase.from("grades").select("exam_id").in("exam_id", examIds)
      : { data: [] as { exam_id: string }[] };

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ClassPicker classes={classes} value={classId} />
          <CreateExamDialog classId={classId} defaultSubject={currentClass.courseTitle} />
        </div>

        {exams && exams.length > 0 ? (
          <div className="space-y-3">
            {exams.map((exam) => {
              const gradedCount = (grades ?? []).filter((g) => g.exam_id === exam.id).length;
              return (
                <Link key={exam.id} href={`/dashboard/exams/${exam.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{exam.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {exam.subject ?? currentClass.courseTitle} · {formatDate(exam.exam_date)}
                        </p>
                      </div>
                      <Badge variant="secondary">{gradedCount} graded</Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={GraduationCap} title="No exams yet" description="Create one to start recording grades." />
        )}
      </div>
    );
  }

  // Student view
  const classes = await getEnrolledClasses(supabase, id);
  const classIds = classes.map((c) => c.classId);
  const classMap = new Map(classes.map((c) => [c.classId, c]));

  const { data: exams } = classIds.length
    ? await supabase.from("exams").select("*").in("class_id", classIds).order("exam_date", { ascending: false })
    : { data: [] as Database["public"]["Tables"]["exams"]["Row"][] };

  const examIds = (exams ?? []).map((e) => e.id);
  const { data: grades } = examIds.length
    ? await supabase.from("grades").select("*").in("exam_id", examIds).eq("student_id", id)
    : { data: [] as Database["public"]["Tables"]["grades"]["Row"][] };
  const gradeMap = new Map((grades ?? []).map((g) => [g.exam_id, g]));

  return (
    <div className="space-y-3">
      {exams && exams.length > 0 ? (
        exams.map((exam) => {
          const grade = gradeMap.get(exam.id);
          const pct = grade ? scoreToPercent(grade.score, Number(exam.max_score)) : null;
          return (
            <Link key={exam.id} href={`/dashboard/exams/${exam.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{exam.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {classMap.get(exam.class_id)?.courseTitle} · {formatDate(exam.exam_date)}
                    </p>
                  </div>
                  {pct != null ? (
                    <Badge className="border-success/40 bg-success/10 text-success">{pct}%</Badge>
                  ) : (
                    <Badge variant="outline">Not graded yet</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })
      ) : (
        <EmptyState icon={GraduationCap} title="No exams yet" description="Exams from your courses will show up here." />
      )}
    </div>
  );
}
