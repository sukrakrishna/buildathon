"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateInterventionPlan } from "@/lib/ai/intervention";
import type { InterventionTask, RiskLevel } from "@/types/database";

export async function createInterventionPlanAction(input: {
  studentId: string;
  studentName: string;
  focusSubject: string;
  riskLevel: RiskLevel;
  summary: string;
  recommendations: string[];
  insightId: string | null;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const { tasks: drafts, source } = await generateInterventionPlan(input.studentName, input.focusSubject, {
    summary: input.summary,
    recommendations: input.recommendations,
  });

  const tasks: InterventionTask[] = drafts.map((t) => ({ day: t.day, title: t.title, completed: false, completed_at: null }));

  const { error } = await supabase.from("intervention_plans").insert({
    student_id: input.studentId,
    insight_id: input.insightId,
    focus_subject: input.focusSubject,
    risk_level_at_creation: input.riskLevel,
    tasks,
    source,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/progress");
  revalidatePath("/dashboard/students");
  return { error: null };
}

export async function toggleInterventionTaskAction(planId: string, day: number): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: plan, error: fetchError } = await supabase
    .from("intervention_plans")
    .select("tasks")
    .eq("id", planId)
    .single();
  if (fetchError || !plan) return { error: fetchError?.message ?? "Plan not found" };

  const tasks = (plan.tasks as InterventionTask[]).map((t) =>
    t.day === day ? { ...t, completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null } : t
  );

  const { error } = await supabase.from("intervention_plans").update({ tasks }).eq("id", planId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/progress");
  revalidatePath("/dashboard/students");
  return { error: null };
}
