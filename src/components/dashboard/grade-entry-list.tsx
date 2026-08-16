"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { enterGradeAction } from "@/lib/actions/exams";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initials, scoreToPercent } from "@/lib/format";

export interface GradeRow {
  studentId: string;
  studentName: string;
  score: number | null;
  remarks: string | null;
}

export function GradeEntryList({ examId, maxScore, rows }: { examId: string; maxScore: number; rows: GradeRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>;
  }

  return (
    <div className="divide-y rounded-xl border">
      {rows.map((row) => (
        <GradeInputRow key={row.studentId} examId={examId} maxScore={maxScore} row={row} />
      ))}
    </div>
  );
}

function GradeInputRow({ examId, maxScore, row }: { examId: string; maxScore: number; row: GradeRow }) {
  const [score, setScore] = useState(row.score != null ? String(row.score) : "");
  const [remarks, setRemarks] = useState(row.remarks ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const pct = score !== "" && !Number.isNaN(Number(score)) ? scoreToPercent(Number(score), maxScore) : null;

  function handleSave() {
    const parsed = Number(score);
    if (score === "" || Number.isNaN(parsed)) {
      toast.error("Enter a valid score");
      return;
    }
    startTransition(async () => {
      const { error } = await enterGradeAction({ examId, studentId: row.studentId, score: parsed, remarks });
      if (error) toast.error(error);
      else {
        toast.success("Grade saved");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials(row.studentName)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{row.studentName}</span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder={`/ ${maxScore}`}
          className="w-24"
          min={0}
          max={maxScore}
        />
        {pct != null && <span className="w-12 text-xs text-muted-foreground">{pct}%</span>}
        <Input
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Remarks (optional)"
          className="w-44"
        />
        <Button size="sm" onClick={handleSave} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
        </Button>
      </div>
    </div>
  );
}
