"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";
import type { UserRole } from "@/types/database";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Please log in." as const };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { supabase, error: "Admins only." as const };

  return { supabase, error: null };
}

export async function createCourseAction(input: {
  title: string;
  description: string;
  category: string;
  level: string;
  teacherId: string | null;
  isPublished: boolean;
}): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };
  if (!input.title.trim()) return { error: "Give the course a title." };

  const baseSlug = slugify(input.title);
  let slug = baseSlug;
  for (let i = 1; i <= 20; i++) {
    const { data: existing } = await supabase.from("courses").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${i + 1}`;
  }

  const { error } = await supabase.from("courses").insert({
    title: input.title.trim(),
    slug,
    description: input.description.trim() || null,
    category: input.category.trim() || null,
    level: input.level || "beginner",
    teacher_id: input.teacherId,
    is_published: input.isPublished,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { error: null };
}

export async function updateCourseAction(
  courseId: string,
  input: { title: string; description: string; category: string; level: string; teacherId: string | null; isPublished: boolean }
): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("courses")
    .update({
      title: input.title.trim(),
      description: input.description.trim() || null,
      category: input.category.trim() || null,
      level: input.level || "beginner",
      teacher_id: input.teacherId,
      is_published: input.isPublished,
    })
    .eq("id", courseId);

  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { error: null };
}

export async function deleteCourseAction(courseId: string): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { error: null };
}

export async function createClassAction(input: {
  courseId: string;
  teacherId: string | null;
  name: string;
  schedule: string;
  room: string;
  capacity: number;
  startDate: string;
  endDate: string;
}): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };
  if (!input.name.trim()) return { error: "Give the class a name." };

  const { error } = await supabase.from("classes").insert({
    course_id: input.courseId,
    teacher_id: input.teacherId,
    name: input.name.trim(),
    schedule: input.schedule.trim() || null,
    room: input.room.trim() || null,
    capacity: input.capacity,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/classes");
  return { error: null };
}

export async function deleteClassAction(classId: string): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) return { error: error.message };
  revalidatePath("/admin/classes");
  return { error: null };
}

export async function updateUserRoleAction(userId: string, role: UserRole): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/students");
  revalidatePath("/admin/teachers");
  return { error: null };
}
