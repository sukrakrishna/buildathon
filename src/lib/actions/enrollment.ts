"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function enrollInClassAction(classId: string, courseSlug: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please log in to enroll." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "student") return { error: "Only students can enroll in courses." };

  const { error } = await supabase.from("enrollments").insert({ class_id: classId, student_id: user.id });

  if (error) {
    if (error.code === "23505") return { error: "You're already enrolled in this class." };
    return { error: error.message };
  }

  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/dashboard");
  return { error: null };
}
