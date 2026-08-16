import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export interface EnrolledClass {
  classId: string;
  className: string;
  courseId: string;
  courseTitle: string;
  teacherId: string | null;
}

export async function getEnrolledClasses(supabase: DbClient, studentId: string): Promise<EnrolledClass[]> {
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("class_id")
    .eq("student_id", studentId)
    .eq("status", "active");

  const classIds = (enrollments ?? []).map((e) => e.class_id);
  if (classIds.length === 0) return [];

  const { data: classes } = await supabase.from("classes").select("*").in("id", classIds);
  const courseIds = [...new Set((classes ?? []).map((c) => c.course_id))];
  const { data: courses } = courseIds.length
    ? await supabase.from("courses").select("id, title").in("id", courseIds)
    : { data: [] as { id: string; title: string }[] };
  const courseMap = new Map((courses ?? []).map((c) => [c.id, c.title]));

  return (classes ?? []).map((c) => ({
    classId: c.id,
    className: c.name,
    courseId: c.course_id,
    courseTitle: courseMap.get(c.course_id) ?? "Untitled course",
    teacherId: c.teacher_id,
  }));
}

export interface TeacherClass {
  classId: string;
  className: string;
  courseId: string;
  courseTitle: string;
  studentCount: number;
}

export async function getTeacherClasses(supabase: DbClient, teacherId: string): Promise<TeacherClass[]> {
  const { data: classes } = await supabase.from("classes").select("*").eq("teacher_id", teacherId);
  if (!classes || classes.length === 0) return [];

  const classIds = classes.map((c) => c.id);
  const courseIds = [...new Set(classes.map((c) => c.course_id))];

  const [{ data: courses }, { data: enrollments }] = await Promise.all([
    supabase.from("courses").select("id, title").in("id", courseIds),
    supabase.from("enrollments").select("class_id").in("class_id", classIds).eq("status", "active"),
  ]);

  const courseMap = new Map((courses ?? []).map((c) => [c.id, c.title]));
  const countByClass = new Map<string, number>();
  for (const e of enrollments ?? []) {
    countByClass.set(e.class_id, (countByClass.get(e.class_id) ?? 0) + 1);
  }

  return classes.map((c) => ({
    classId: c.id,
    className: c.name,
    courseId: c.course_id,
    courseTitle: courseMap.get(c.course_id) ?? "Untitled course",
    studentCount: countByClass.get(c.id) ?? 0,
  }));
}

export async function getAllClassesForManagement(supabase: DbClient): Promise<TeacherClass[]> {
  const { data: classes } = await supabase.from("classes").select("*").order("created_at", { ascending: false });
  if (!classes || classes.length === 0) return [];

  const classIds = classes.map((c) => c.id);
  const courseIds = [...new Set(classes.map((c) => c.course_id))];

  const [{ data: courses }, { data: enrollments }] = await Promise.all([
    supabase.from("courses").select("id, title").in("id", courseIds),
    supabase.from("enrollments").select("class_id").in("class_id", classIds).eq("status", "active"),
  ]);

  const courseMap = new Map((courses ?? []).map((c) => [c.id, c.title]));
  const countByClass = new Map<string, number>();
  for (const e of enrollments ?? []) {
    countByClass.set(e.class_id, (countByClass.get(e.class_id) ?? 0) + 1);
  }

  return classes.map((c) => ({
    classId: c.id,
    className: c.name,
    courseId: c.course_id,
    courseTitle: courseMap.get(c.course_id) ?? "Untitled course",
    studentCount: countByClass.get(c.id) ?? 0,
  }));
}

export interface ClassPerformance {
  classId: string;
  studentCount: number;
  avgAttendance: number | null;
  avgAssignment: number | null;
  avgExam: number | null;
  atRiskCount: number;
}

export async function getClassPerformanceSummary(supabase: DbClient, classId: string): Promise<ClassPerformance> {
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id")
    .eq("class_id", classId)
    .eq("status", "active");
  const studentIds = (enrollments ?? []).map((e) => e.student_id);

  if (studentIds.length === 0) {
    return { classId, studentCount: 0, avgAttendance: null, avgAssignment: null, avgExam: null, atRiskCount: 0 };
  }

  const [{ data: attendance }, { data: assignments }, { data: exams }, { data: insights }] = await Promise.all([
    supabase.from("attendance").select("student_id, status").eq("class_id", classId).in("student_id", studentIds),
    supabase.from("assignments").select("id, max_score").eq("class_id", classId),
    supabase.from("exams").select("id, max_score").eq("class_id", classId),
    supabase
      .from("ai_insights")
      .select("student_id, risk_level, generated_at")
      .in("student_id", studentIds)
      .order("generated_at", { ascending: false }),
  ]);

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const examIds = (exams ?? []).map((e) => e.id);
  const maxByAssignment = new Map((assignments ?? []).map((a) => [a.id, Number(a.max_score)]));
  const maxByExam = new Map((exams ?? []).map((e) => [e.id, Number(e.max_score)]));

  const [{ data: submissions }, { data: grades }] = await Promise.all([
    assignmentIds.length
      ? supabase.from("submissions").select("assignment_id, score").in("assignment_id", assignmentIds).in("student_id", studentIds)
      : Promise.resolve({ data: [] as { assignment_id: string; score: number | null }[] }),
    examIds.length
      ? supabase.from("grades").select("exam_id, score").in("exam_id", examIds).in("student_id", studentIds)
      : Promise.resolve({ data: [] as { exam_id: string; score: number }[] }),
  ]);

  const avg = (nums: number[]) => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null);

  const present = (attendance ?? []).filter((a) => a.status === "present" || a.status === "late").length;
  const avgAttendance = attendance && attendance.length > 0 ? Math.round((present / attendance.length) * 1000) / 10 : null;

  const assignmentPercents = (submissions ?? [])
    .filter((s) => s.score != null && maxByAssignment.get(s.assignment_id))
    .map((s) => (Number(s.score) / maxByAssignment.get(s.assignment_id)!) * 100);

  const examPercents = (grades ?? [])
    .filter((g) => maxByExam.get(g.exam_id))
    .map((g) => (Number(g.score) / maxByExam.get(g.exam_id)!) * 100);

  const latestRiskByStudent = new Map<string, string>();
  for (const i of insights ?? []) {
    if (!latestRiskByStudent.has(i.student_id)) latestRiskByStudent.set(i.student_id, i.risk_level);
  }
  const atRiskCount = [...latestRiskByStudent.values()].filter((r) => r === "high").length;

  return {
    classId,
    studentCount: studentIds.length,
    avgAttendance,
    avgAssignment: avg(assignmentPercents),
    avgExam: avg(examPercents),
    atRiskCount,
  };
}

export interface SubjectPerformance {
  classId: string;
  subject: string;
  attendanceRate: number | null;
  assignmentAvgPercent: number | null;
  examAvgPercent: number | null;
}

export interface StudentPerformanceSummary {
  attendanceRate: number | null;
  attendancePresent: number;
  attendanceTotal: number;
  subjects: SubjectPerformance[];
  recentSubmissions: { title: string; subject: string; scorePercent: number | null; status: string; submittedAt: string }[];
  recentGrades: { title: string; subject: string; scorePercent: number; examDate: string | null }[];
  overallAssignmentAvgPercent: number | null;
  overallExamAvgPercent: number | null;
}

export async function getStudentPerformanceSummary(
  supabase: DbClient,
  studentId: string
): Promise<StudentPerformanceSummary> {
  const classes = await getEnrolledClasses(supabase, studentId);
  const classIds = classes.map((c) => c.classId);
  const subjectByClass = new Map(classes.map((c) => [c.classId, c.courseTitle]));

  if (classIds.length === 0) {
    return {
      attendanceRate: null,
      attendancePresent: 0,
      attendanceTotal: 0,
      subjects: [],
      recentSubmissions: [],
      recentGrades: [],
      overallAssignmentAvgPercent: null,
      overallExamAvgPercent: null,
    };
  }

  const [{ data: attendance }, { data: assignments }, { data: exams }] = await Promise.all([
    supabase.from("attendance").select("*").in("class_id", classIds).eq("student_id", studentId),
    supabase.from("assignments").select("*").in("class_id", classIds),
    supabase.from("exams").select("*").in("class_id", classIds),
  ]);

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const examIds = (exams ?? []).map((e) => e.id);

  const [{ data: submissions }, { data: grades }] = await Promise.all([
    assignmentIds.length
      ? supabase.from("submissions").select("*").in("assignment_id", assignmentIds).eq("student_id", studentId)
      : Promise.resolve({ data: [] as Database["public"]["Tables"]["submissions"]["Row"][] }),
    examIds.length
      ? supabase.from("grades").select("*").in("exam_id", examIds).eq("student_id", studentId)
      : Promise.resolve({ data: [] as Database["public"]["Tables"]["grades"]["Row"][] }),
  ]);

  const assignmentById = new Map((assignments ?? []).map((a) => [a.id, a]));
  const examById = new Map((exams ?? []).map((e) => [e.id, e]));

  // --- attendance ---
  const attendancePresent = (attendance ?? []).filter((a) => a.status === "present" || a.status === "late").length;
  const attendanceTotal = attendance?.length ?? 0;
  const attendanceRate = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 1000) / 10 : null;

  const attendanceByClass = new Map<string, { present: number; total: number }>();
  for (const a of attendance ?? []) {
    const bucket = attendanceByClass.get(a.class_id) ?? { present: 0, total: 0 };
    bucket.total += 1;
    if (a.status === "present" || a.status === "late") bucket.present += 1;
    attendanceByClass.set(a.class_id, bucket);
  }

  // --- assignment scores per class ---
  const assignmentPercentsByClass = new Map<string, number[]>();
  const allAssignmentPercents: number[] = [];
  for (const s of submissions ?? []) {
    if (s.score == null) continue;
    const assignment = assignmentById.get(s.assignment_id);
    if (!assignment || !assignment.max_score) continue;
    const pct = (Number(s.score) / Number(assignment.max_score)) * 100;
    allAssignmentPercents.push(pct);
    const arr = assignmentPercentsByClass.get(assignment.class_id) ?? [];
    arr.push(pct);
    assignmentPercentsByClass.set(assignment.class_id, arr);
  }

  // --- exam scores per class ---
  const examPercentsByClass = new Map<string, number[]>();
  const allExamPercents: number[] = [];
  for (const g of grades ?? []) {
    const exam = examById.get(g.exam_id);
    if (!exam || !exam.max_score) continue;
    const pct = (Number(g.score) / Number(exam.max_score)) * 100;
    allExamPercents.push(pct);
    const arr = examPercentsByClass.get(exam.class_id) ?? [];
    arr.push(pct);
    examPercentsByClass.set(exam.class_id, arr);
  }

  const avg = (nums: number[]) => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null);

  const subjects: SubjectPerformance[] = classIds.map((classId) => {
    const att = attendanceByClass.get(classId);
    return {
      classId,
      subject: subjectByClass.get(classId) ?? "Unknown",
      attendanceRate: att && att.total > 0 ? Math.round((att.present / att.total) * 1000) / 10 : null,
      assignmentAvgPercent: avg(assignmentPercentsByClass.get(classId) ?? []),
      examAvgPercent: avg(examPercentsByClass.get(classId) ?? []),
    };
  });

  const recentSubmissions = (submissions ?? [])
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 8)
    .map((s) => {
      const assignment = assignmentById.get(s.assignment_id);
      return {
        title: assignment?.title ?? "Assignment",
        subject: assignment ? subjectByClass.get(assignment.class_id) ?? "Unknown" : "Unknown",
        scorePercent:
          s.score != null && assignment?.max_score ? Math.round((Number(s.score) / Number(assignment.max_score)) * 1000) / 10 : null,
        status: s.status,
        submittedAt: s.submitted_at,
      };
    });

  const recentGrades = (grades ?? [])
    .sort((a, b) => new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime())
    .slice(0, 8)
    .map((g) => {
      const exam = examById.get(g.exam_id);
      return {
        title: exam?.title ?? "Exam",
        subject: exam ? subjectByClass.get(exam.class_id) ?? "Unknown" : "Unknown",
        scorePercent: exam?.max_score ? Math.round((Number(g.score) / Number(exam.max_score)) * 1000) / 10 : 0,
        examDate: exam?.exam_date ?? null,
      };
    });

  return {
    attendanceRate,
    attendancePresent,
    attendanceTotal,
    subjects,
    recentSubmissions,
    recentGrades,
    overallAssignmentAvgPercent: avg(allAssignmentPercents),
    overallExamAvgPercent: avg(allExamPercents),
  };
}
