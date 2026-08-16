"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateSubmissionFeedback } from "@/lib/ai/submission-feedback";

export async function createAssignmentAction(input: {
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };
  if (!input.title.trim()) return { error: "Give the assignment a title." };

  const { error } = await supabase.from("assignments").insert({
    class_id: input.classId,
    title: input.title.trim(),
    description: input.description.trim() || null,
    due_date: input.dueDate || null,
    max_score: input.maxScore,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/assignments");
  return { error: null };
}

export async function submitAssignmentAction(input: {
  assignmentId: string;
  content: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };
  if (!input.content.trim()) return { error: "Write something before submitting." };

  const { data: assignment } = await supabase
    .from("assignments")
    .select("title, description, due_date")
    .eq("id", input.assignmentId)
    .single();

  const isLate = assignment?.due_date ? new Date(assignment.due_date).getTime() < Date.now() : false;

  const { feedback } = await generateSubmissionFeedback({
    assignmentTitle: assignment?.title ?? "Assignment",
    assignmentDescription: assignment?.description ?? null,
    content: input.content,
  });

  const { error } = await supabase.from("submissions").upsert(
    {
      assignment_id: input.assignmentId,
      student_id: user.id,
      content: input.content,
      status: isLate ? "late" : "submitted",
      ai_feedback: feedback,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "assignment_id,student_id" }
  );

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/assignments/${input.assignmentId}`);
  revalidatePath("/dashboard/assignments");
  return { error: null };
}

export async function gradeSubmissionAction(input: {
  submissionId: string;
  score: number;
  feedback: string;
  assignmentId: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("submissions")
    .update({
      score: input.score,
      feedback: input.feedback.trim() || null,
      status: "graded",
      graded_at: new Date().toISOString(),
    })
    .eq("id", input.submissionId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/assignments/${input.assignmentId}`);
  return { error: null };
}
