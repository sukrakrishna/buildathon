"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/types/database";

export async function markAttendanceAction(
  classId: string,
  sessionDate: string,
  records: { studentId: string; status: AttendanceStatus }[]
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };
  if (records.length === 0) return { error: null };

  const rows = records.map((r) => ({
    class_id: classId,
    student_id: r.studentId,
    session_date: sessionDate,
    status: r.status,
    marked_by: user.id,
  }));

  const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "class_id,student_id,session_date" });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/attendance");
  return { error: null };
}
