"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createExamAction(input: {
  classId: string;
  title: string;
  subject: string;
  examDate: string;
  maxScore: number;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };
  if (!input.title.trim()) return { error: "Give the exam a title." };

  const { error } = await supabase.from("exams").insert({
    class_id: input.classId,
    title: input.title.trim(),
    subject: input.subject.trim() || null,
    exam_date: input.examDate || null,
    max_score: input.maxScore,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/exams");
  return { error: null };
}

export async function enterGradeAction(input: {
  examId: string;
  studentId: string;
  score: number;
  remarks: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const { error } = await supabase.from("grades").upsert(
    {
      exam_id: input.examId,
      student_id: input.studentId,
      score: input.score,
      remarks: input.remarks.trim() || null,
      graded_by: user.id,
      graded_at: new Date().toISOString(),
    },
    { onConflict: "exam_id,student_id" }
  );

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/exams/${input.examId}`);
  revalidatePath("/dashboard/exams");
  return { error: null };
}
