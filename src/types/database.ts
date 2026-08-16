// Hand-written to match supabase/schema.sql. If you later run
// `supabase gen types typescript`, you can swap this file for the generated one —
// the shape below matches what that command would produce.
//
// NOTE: these are all `type` aliases, not `interface`s, on purpose — the
// installed @supabase/postgrest-js select-query-parser resolves `Row` types
// referenced via `interface` to `never`, but resolves plain object `type`
// aliases correctly. Keep new row types as `type`.

export type UserRole = "student" | "teacher" | "admin";
export type EnrollmentStatus = "active" | "completed" | "dropped";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type SubmissionStatus = "submitted" | "graded" | "late" | "missing";
export type RiskLevel = "low" | "medium" | "high";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  level: string | null;
  cover_image_url: string | null;
  price: number;
  rating: number;
  teacher_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Class = {
  id: string;
  course_id: string;
  teacher_id: string | null;
  name: string;
  schedule: string | null;
  room: string | null;
  capacity: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export type Enrollment = {
  id: string;
  class_id: string;
  student_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
};

export type Attendance = {
  id: string;
  class_id: string;
  student_id: string;
  session_date: string;
  status: AttendanceStatus;
  notes: string | null;
  marked_by: string | null;
  created_at: string;
};

export type Assignment = {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
  created_by: string | null;
  created_at: string;
};

export type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  file_url: string | null;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  ai_feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
};

export type Exam = {
  id: string;
  class_id: string;
  title: string;
  subject: string | null;
  exam_date: string | null;
  max_score: number;
  created_by: string | null;
  created_at: string;
};

export type Grade = {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  remarks: string | null;
  graded_by: string | null;
  graded_at: string;
};

export type AiInsight = {
  id: string;
  student_id: string;
  risk_level: RiskLevel;
  weak_subjects: string[];
  recommendations: string[];
  summary: string | null;
  raw_response: Record<string, unknown> | null;
  generated_at: string;
  generated_by: string | null;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  created_by: string | null;
  published_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};

// Shaped to match what `supabase gen types typescript` would emit (Relationships
// arrays + Views/Functions/Enums/CompositeTypes), which is what @supabase/supabase-js's
// generics require to resolve real row types instead of collapsing to `never`.
type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, Partial<Profile> & { id: string }>;
      courses: Table<Course, Partial<Course> & { title: string; slug: string }>;
      classes: Table<Class, Partial<Class> & { course_id: string; name: string }>;
      enrollments: Table<Enrollment, Partial<Enrollment> & { class_id: string; student_id: string }>;
      attendance: Table<Attendance, Partial<Attendance> & { class_id: string; student_id: string; session_date: string }>;
      assignments: Table<Assignment, Partial<Assignment> & { class_id: string; title: string }>;
      submissions: Table<Submission, Partial<Submission> & { assignment_id: string; student_id: string }>;
      exams: Table<Exam, Partial<Exam> & { class_id: string; title: string }>;
      grades: Table<Grade, Partial<Grade> & { exam_id: string; student_id: string; score: number }>;
      ai_insights: Table<AiInsight, Partial<AiInsight> & { student_id: string }>;
      announcements: Table<Announcement, Partial<Announcement> & { title: string; body: string }>;
      contact_messages: Table<ContactMessage, Partial<ContactMessage> & { name: string; email: string; message: string }>;
    };
    Views: { [_ in never]: never };
    Functions: {
      current_role: { Args: Record<string, never>; Returns: UserRole };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_teacher: { Args: Record<string, never>; Returns: boolean };
      owns_class: { Args: { target_class_id: string }; Returns: boolean };
      is_enrolled: { Args: { target_class_id: string }; Returns: boolean };
      teaches_student: { Args: { target_student_id: string }; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      enrollment_status: EnrollmentStatus;
      attendance_status: AttendanceStatus;
      submission_status: SubmissionStatus;
      risk_level: RiskLevel;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
