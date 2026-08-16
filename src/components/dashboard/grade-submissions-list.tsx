"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Sparkles } from "lucide-react";
import { gradeSubmissionAction } from "@/lib/actions/assignments";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/format";

export interface SubmissionRow {
  id: string;
  studentName: string;
  content: string | null;
  aiFeedback: string | null;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
}

export function GradeSubmissionsList({
  assignmentId,
  maxScore,
  submissions,
}: {
  assignmentId: string;
  maxScore: number;
  submissions: SubmissionRow[];
}) {
  if (submissions.length === 0) {
    return <p className="text-sm text-muted-foreground">No submissions yet.</p>;
  }

  return (
    <div className="space-y-4">
      {submissions.map((s) => (
        <GradeRow key={s.id} assignmentId={assignmentId} maxScore={maxScore} submission={s} />
      ))}
    </div>
  );
}

function GradeRow({
  assignmentId,
  maxScore,
  submission,
}: {
  assignmentId: string;
  maxScore: number;
  submission: SubmissionRow;
}) {
  const [score, setScore] = useState(submission.score != null ? String(submission.score) : "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    const parsed = Number(score);
    if (Number.isNaN(parsed)) {
      toast.error("Enter a valid score");
      return;
    }
    startTransition(async () => {
      const { error } = await gradeSubmissionAction({
        submissionId: submission.id,
        score: parsed,
        feedback,
        assignmentId,
      });
      if (error) toast.error(error);
      else {
        toast.success("Grade saved");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials(submission.studentName)}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium">{submission.studentName}</span>
        {submission.score != null && <Badge variant="secondary">Graded</Badge>}
      </div>

      {submission.content && (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          {submission.content}
        </p>
      )}

      {submission.aiFeedback && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-ai/30 bg-ai-soft p-3 text-sm">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-ai" />
          <span className="text-muted-foreground">{submission.aiFeedback}</span>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder={`Score / ${maxScore}`}
          className="sm:w-32"
          min={0}
          max={maxScore}
        />
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Feedback for student (optional)"
          rows={1}
          className="flex-1"
        />
        <Button size="sm" onClick={handleSave} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Save
        </Button>
      </div>
    </div>
  );
}
