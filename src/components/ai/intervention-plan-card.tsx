"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, ClipboardCheck, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createInterventionPlanAction, toggleInterventionTaskAction } from "@/lib/actions/intervention";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { InterventionPlan, RiskLevel } from "@/types/database";

export function InterventionPlanCard({
  studentId,
  studentName,
  riskLevel,
  weakSubjects,
  summary,
  recommendations,
  insightId,
  canManage,
}: {
  studentId: string;
  studentName: string;
  riskLevel: RiskLevel;
  weakSubjects: string[];
  summary: string;
  recommendations: string[];
  insightId: string | null;
  canManage: boolean;
}) {
  const [plan, setPlan] = useState<InterventionPlan | null | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("intervention_plans")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setPlan(data ?? null);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  function handleGenerate() {
    startTransition(async () => {
      const { error } = await createInterventionPlanAction({
        studentId,
        studentName,
        focusSubject: weakSubjects[0] ?? "overall performance",
        riskLevel,
        summary,
        recommendations,
        insightId,
      });
      if (error) {
        toast.error(error);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("intervention_plans")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setPlan(data ?? null);
      toast.success("Intervention plan created");
    });
  }

  function handleToggle(day: number) {
    if (!plan) return;
    const optimistic = {
      ...plan,
      tasks: plan.tasks.map((t) => (t.day === day ? { ...t, completed: !t.completed } : t)),
    };
    setPlan(optimistic);
    startTransition(async () => {
      const { error } = await toggleInterventionTaskAction(plan.id, day);
      if (error) toast.error(error);
    });
  }

  if (plan === undefined) return null;

  if (!plan) {
    if (!canManage) return null;
    return (
      <div className="mt-4 rounded-xl border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">No intervention plan yet.</p>
        <Button size="sm" className="mt-2" onClick={handleGenerate} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
          Generate 7-day intervention plan
        </Button>
      </div>
    );
  }

  const completedCount = plan.tasks.filter((t) => t.completed).length;
  const progressPct = plan.tasks.length ? Math.round((completedCount / plan.tasks.length) * 100) : 0;

  return (
    <div className="mt-4 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-ai" />
          <span className="text-sm font-semibold">Intervention plan</span>
          {plan.focus_subject && <Badge variant="outline">{plan.focus_subject}</Badge>}
        </div>
        <span className="text-xs text-muted-foreground">{completedCount}/{plan.tasks.length} complete</span>
      </div>
      <Progress value={progressPct} className="mt-2" />
      <ul className="mt-3 space-y-1.5">
        {plan.tasks.map((t) => (
          <li key={t.day}>
            <button
              type="button"
              disabled={!canManage || pending}
              onClick={() => handleToggle(t.day)}
              className="flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left text-sm hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent"
            >
              {t.completed ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <span className={t.completed ? "text-muted-foreground line-through" : ""}>
                Day {t.day} — {t.title}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
