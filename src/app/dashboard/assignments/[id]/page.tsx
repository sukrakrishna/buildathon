import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfilesMap } from "@/lib/data/profiles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmissionForm } from "@/components/dashboard/submission-form";
import { GradeSubmissionsList, type SubmissionRow } from "@/components/dashboard/grade-submissions-list";
import { formatDateTime } from "@/lib/format";

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId, profile } = await requireUser();
  const { id: assignmentId } = await params;
  const supabase = await createClient();

  const { data: assignment } = await supabase.from("assignments").select("*").eq("id", assignmentId).maybeSingle();
  if (!assignment) notFound();

  const isPastDue = assignment.due_date ? new Date(assignment.due_date).getTime() < Date.now() : false;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant={isPastDue ? "outline" : "secondary"} className={isPastDue ? "border-danger/40 text-danger" : ""}>
            Due {formatDateTime(assignment.due_date)}
          </Badge>
          <Badge variant="outline">{assignment.max_score} pts</Badge>
        </div>
        <h2 className="text-2xl font-semibold">{assignment.title}</h2>
        {assignment.description && <p className="mt-2 whitespace-pre-line text-muted-foreground">{assignment.description}</p>}
      </div>

      {profile.role === "teacher" || profile.role === "admin" ? (
        <TeacherGrading assignmentId={assignmentId} maxScore={Number(assignment.max_score)} />
      ) : (
        <StudentSubmission assignmentId={assignmentId} studentId={userId} maxScore={Number(assignment.max_score)} />
      )}
    </div>
  );
}

async function StudentSubmission({
  assignmentId,
  studentId,
  maxScore,
}: {
  assignmentId: string;
  studentId: string;
  maxScore: number;
}) {
  const supabase = await createClient();
  const { data: submission } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .maybeSingle();

  return (
    <Card>
      <CardContent>
        <SubmissionForm
          assignmentId={assignmentId}
          existingContent={submission?.content ?? null}
          aiFeedback={submission?.ai_feedback ?? null}
          score={submission?.score ?? null}
          maxScore={maxScore}
          teacherFeedback={submission?.feedback ?? null}
        />
      </CardContent>
    </Card>
  );
}

async function TeacherGrading({ assignmentId, maxScore }: { assignmentId: string; maxScore: number }) {
  const supabase = await createClient();
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .order("submitted_at", { ascending: false });

  const profileMap = await getProfilesMap(supabase, (submissions ?? []).map((s) => s.student_id));

  const rows: SubmissionRow[] = (submissions ?? []).map((s) => ({
    id: s.id,
    studentName: profileMap.get(s.student_id)?.full_name ?? "Student",
    content: s.content,
    aiFeedback: s.ai_feedback,
    score: s.score,
    feedback: s.feedback,
    submittedAt: s.submitted_at,
  }));

  return (
    <Card>
      <CardContent>
        <GradeSubmissionsList assignmentId={assignmentId} maxScore={maxScore} submissions={rows} />
      </CardContent>
    </Card>
  );
}
