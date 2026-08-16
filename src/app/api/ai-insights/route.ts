import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentPerformanceSummary } from "@/lib/data/academics";
import { generateStudentInsight } from "@/lib/ai/insights";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: caller } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  const studentId = typeof body.studentId === "string" && body.studentId ? body.studentId : user.id;

  if (studentId !== user.id) {
    if (caller?.role === "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (caller?.role === "teacher") {
      const { data: teaches } = await supabase.rpc("teaches_student", { target_student_id: studentId });
      if (!teaches) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", studentId)
    .single();

  if (!studentProfile || studentProfile.role !== "student") {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const summary = await getStudentPerformanceSummary(supabase, studentId);
  const { result, source } = await generateStudentInsight(studentProfile.full_name, summary);

  const { data: inserted } = await supabase
    .from("ai_insights")
    .insert({
      student_id: studentId,
      risk_level: result.riskLevel,
      weak_subjects: result.weakSubjects,
      recommendations: result.recommendations,
      summary: result.summary,
      raw_response: { source, confidence: result.confidence, factors: result.factors, trend: result.trend },
      generated_by: user.id,
    })
    .select("id, generated_at")
    .single();

  return NextResponse.json({
    insightId: inserted?.id ?? null,
    riskLevel: result.riskLevel,
    weakSubjects: result.weakSubjects,
    recommendations: result.recommendations,
    summary: result.summary,
    confidence: result.confidence,
    factors: result.factors,
    trend: result.trend,
    source,
    attendanceRate: summary.attendanceRate,
    overallAssignmentAvgPercent: summary.overallAssignmentAvgPercent,
    overallExamAvgPercent: summary.overallExamAvgPercent,
    subjects: summary.subjects,
    generatedAt: inserted?.generated_at ?? new Date().toISOString(),
  });
}
