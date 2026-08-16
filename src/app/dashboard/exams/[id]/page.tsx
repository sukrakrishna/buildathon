import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfilesMap } from "@/lib/data/profiles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GradeEntryList, type GradeRow } from "@/components/dashboard/grade-entry-list";
import { formatDate, scoreToPercent, percentToLetter } from "@/lib/format";

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId, profile } = await requireUser();
  const { id: examId } = await params;
  const supabase = await createClient();

  const { data: exam } = await supabase.from("exams").select("*").eq("id", examId).maybeSingle();
  if (!exam) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline">{formatDate(exam.exam_date)}</Badge>
          <Badge variant="outline">{exam.max_score} pts</Badge>
          {exam.subject && <Badge variant="secondary">{exam.subject}</Badge>}
        </div>
        <h2 className="text-2xl font-semibold">{exam.title}</h2>
      </div>

      {profile.role === "teacher" || profile.role === "admin" ? (
        <TeacherGradeEntry examId={examId} classId={exam.class_id} maxScore={Number(exam.max_score)} />
      ) : (
        <StudentGrade examId={examId} studentId={userId} maxScore={Number(exam.max_score)} />
      )}
    </div>
  );
}

async function StudentGrade({ examId, studentId, maxScore }: { examId: string; studentId: string; maxScore: number }) {
  const supabase = await createClient();
  const { data: grade } = await supabase
    .from("grades")
    .select("*")
    .eq("exam_id", examId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!grade) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Your grade hasn't been entered yet. Check back after your teacher grades this exam.</p>
        </CardContent>
      </Card>
    );
  }

  const pct = scoreToPercent(grade.score, maxScore);

  return (
    <Card>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">Your score</p>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold">
            {grade.score} / {maxScore}
          </span>
          <Badge variant="secondary">{pct}% · {percentToLetter(pct)}</Badge>
        </div>
        {grade.remarks && <p className="pt-2 text-sm text-muted-foreground">{grade.remarks}</p>}
      </CardContent>
    </Card>
  );
}

async function TeacherGradeEntry({ examId, classId, maxScore }: { examId: string; classId: string; maxScore: number }) {
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id")
    .eq("class_id", classId)
    .eq("status", "active");
  const studentIds = (enrollments ?? []).map((e) => e.student_id);

  const [profileMap, { data: grades }] = await Promise.all([
    getProfilesMap(supabase, studentIds),
    studentIds.length
      ? supabase.from("grades").select("*").eq("exam_id", examId).in("student_id", studentIds)
      : Promise.resolve({ data: [] as { student_id: string; score: number; remarks: string | null }[] }),
  ]);
  const gradeMap = new Map((grades ?? []).map((g) => [g.student_id, g]));

  const rows: GradeRow[] = studentIds
    .map((sid) => {
      const p = profileMap.get(sid);
      const g = gradeMap.get(sid);
      return {
        studentId: sid,
        studentName: p?.full_name ?? "Student",
        score: g?.score ?? null,
        remarks: g?.remarks ?? null,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName));

  return (
    <Card>
      <CardContent>
        <GradeEntryList examId={examId} maxScore={maxScore} rows={rows} />
      </CardContent>
    </Card>
  );
}
