"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send, Sparkles } from "lucide-react";
import { submitAssignmentAction } from "@/lib/actions/assignments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export function SubmissionForm({
  assignmentId,
  existingContent,
  aiFeedback,
  score,
  maxScore,
  teacherFeedback,
}: {
  assignmentId: string;
  existingContent: string | null;
  aiFeedback: string | null;
  score: number | null;
  maxScore: number;
  teacherFeedback: string | null;
}) {
  const [content, setContent] = useState(existingContent ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const graded = score != null;

  function handleSubmit() {
    startTransition(async () => {
      const { error } = await submitAssignmentAction({ assignmentId, content });
      if (error) toast.error(error);
      else {
        toast.success(existingContent ? "Resubmitted" : "Submitted");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {graded && (
        <div className="rounded-xl border bg-success/5 p-4">
          <p className="text-sm text-muted-foreground">Grade</p>
          <p className="text-2xl font-semibold">
            {score} / {maxScore}
          </p>
          {teacherFeedback && <p className="mt-2 text-sm text-muted-foreground">{teacherFeedback}</p>}
        </div>
      )}

      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Write or paste your submission here..."
          disabled={graded}
        />
        {!graded && (
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Send />}
            {existingContent ? "Resubmit" : "Submit"}
          </Button>
        )}
      </div>

      {aiFeedback && (
        <div className="ai-gradient-border rounded-xl p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <Sparkles className="size-4 text-ai" />
            <span className="text-sm font-semibold">AI feedback</span>
            <Badge variant="outline" className="border-ai/30 text-[10px] text-ai">Instant</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{aiFeedback}</p>
        </div>
      )}
    </div>
  );
}
