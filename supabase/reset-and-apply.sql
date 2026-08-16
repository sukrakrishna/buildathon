-- ============================================================================
-- RESET + APPLY — for a project that already has a conflicting schema
-- (e.g. a `users` table instead of `profiles`, missing `announcements` /
-- `contact_messages`, or columns that don't match supabase/schema.sql).
--
-- This DROPS every table this app depends on and any it might collide with,
-- then applies the full schema fresh. Only run this if there's no real data
-- in these tables yet — it is NOT reversible.
--
-- Run once in the Supabase SQL editor (Project > SQL Editor > New query).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Reset — drop anything from a previous/different schema attempt
-- ----------------------------------------------------------------------------
drop table if exists public.grades cascade;
drop table if exists public.exams cascade;
drop table if exists public.submissions cascade;
drop table if exists public.assignments cascade;
drop table if exists public.attendance cascade;
drop table if exists public.enrollments cascade;
drop table if exists public.classes cascade;
drop table if exists public.courses cascade;
drop table if exists public.ai_insights cascade;
drop table if exists public.announcements cascade;
drop table if exists public.contact_messages cascade;
drop table if exists public.profiles cascade;
drop table if exists public.users cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.current_role() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.is_teacher() cascade;
drop function if exists public.owns_class(uuid) cascade;
drop function if exists public.is_enrolled(uuid) cascade;
drop function if exists public.teaches_student(uuid) cascade;

drop type if exists public.user_role cascade;
drop type if exists public.enrollment_status cascade;
drop type if exists public.attendance_status cascade;
drop type if exists public.submission_status cascade;
drop type if exists public.risk_level cascade;

-- ----------------------------------------------------------------------------
-- 1. Apply — the full schema (identical to supabase/schema.sql)
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;

do $$ begin
  create type user_role as enum ('student', 'teacher', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enrollment_status as enum ('active', 'completed', 'dropped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('present', 'absent', 'late', 'excused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type submission_status as enum ('submitted', 'graded', 'late', 'missing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type risk_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'student',
  full_name text not null default '',
  avatar_url text,
  bio text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  category text,
  level text default 'beginner',
  cover_image_url text,
  price numeric(10,2) default 0,
  rating numeric(2,1) default 0,
  teacher_id uuid references public.profiles(id) on delete set null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  name text not null,
  schedule text,
  room text,
  capacity int default 30,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status enrollment_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  session_date date not null,
  status attendance_status not null default 'present',
  notes text,
  marked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (class_id, student_id, session_date)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  max_score numeric(6,2) not null default 100,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  file_url text,
  status submission_status not null default 'submitted',
  score numeric(6,2),
  feedback text,
  ai_feedback text,
  submitted_at timestamptz not null default now(),
  graded_at timestamptz,
  unique (assignment_id, student_id)
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  subject text,
  exam_date timestamptz,
  max_score numeric(6,2) not null default 100,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  score numeric(6,2) not null,
  remarks text,
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz not null default now(),
  unique (exam_id, student_id)
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  risk_level risk_level not null default 'low',
  weak_subjects jsonb not null default '[]',
  recommendations jsonb not null default '[]',
  summary text,
  raw_response jsonb,
  generated_at timestamptz not null default now(),
  generated_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists idx_courses_teacher on public.courses(teacher_id);
create index if not exists idx_classes_course on public.classes(course_id);
create index if not exists idx_classes_teacher on public.classes(teacher_id);
create index if not exists idx_enrollments_student on public.enrollments(student_id);
create index if not exists idx_enrollments_class on public.enrollments(class_id);
create index if not exists idx_attendance_class on public.attendance(class_id);
create index if not exists idx_attendance_student on public.attendance(student_id);
create index if not exists idx_assignments_class on public.assignments(class_id);
create index if not exists idx_submissions_assignment on public.submissions(assignment_id);
create index if not exists idx_submissions_student on public.submissions(student_id);
create index if not exists idx_exams_class on public.exams(class_id);
create index if not exists idx_grades_exam on public.grades(exam_id);
create index if not exists idx_grades_student on public.grades(student_id);
create index if not exists idx_ai_insights_student on public.ai_insights(student_id);

create or replace function public.current_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_teacher()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'teacher' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.owns_class(target_class_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.classes c
    where c.id = target_class_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_enrolled(target_class_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e
    where e.class_id = target_class_id and e.student_id = auth.uid()
  );
$$;

create or replace function public.teaches_student(target_student_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.student_id = target_student_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_courses_updated_at on public.courses;
create trigger set_courses_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.attendance enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.exams enable row level security;
alter table public.grades enable row level security;
alter table public.ai_insights enable row level security;
alter table public.announcements enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (auth.role() = 'authenticated');

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles for update
  using (id = auth.uid() or public.is_admin());

drop policy if exists "courses_select_public" on public.courses;
create policy "courses_select_public" on public.courses for select
  using (is_published or teacher_id = auth.uid() or public.is_admin());

drop policy if exists "courses_write_owner_or_admin" on public.courses;
create policy "courses_write_owner_or_admin" on public.courses for insert
  with check (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "courses_update_owner_or_admin" on public.courses;
create policy "courses_update_owner_or_admin" on public.courses for update
  using (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "courses_delete_owner_or_admin" on public.courses;
create policy "courses_delete_owner_or_admin" on public.courses for delete
  using (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "classes_select_public" on public.classes;
create policy "classes_select_public" on public.classes for select
  using (true);

drop policy if exists "classes_insert_owner_or_admin" on public.classes;
create policy "classes_insert_owner_or_admin" on public.classes for insert
  with check (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "classes_update_owner_or_admin" on public.classes;
create policy "classes_update_owner_or_admin" on public.classes for update
  using (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "classes_delete_owner_or_admin" on public.classes;
create policy "classes_delete_owner_or_admin" on public.classes for delete
  using (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "enrollments_select" on public.enrollments;
create policy "enrollments_select" on public.enrollments for select
  using (student_id = auth.uid() or public.owns_class(class_id) or public.is_admin());

drop policy if exists "enrollments_insert" on public.enrollments;
create policy "enrollments_insert" on public.enrollments for insert
  with check (student_id = auth.uid() or public.owns_class(class_id) or public.is_admin());

drop policy if exists "enrollments_update" on public.enrollments;
create policy "enrollments_update" on public.enrollments for update
  using (student_id = auth.uid() or public.owns_class(class_id) or public.is_admin());

drop policy if exists "enrollments_delete" on public.enrollments;
create policy "enrollments_delete" on public.enrollments for delete
  using (student_id = auth.uid() or public.owns_class(class_id) or public.is_admin());

drop policy if exists "attendance_select" on public.attendance;
create policy "attendance_select" on public.attendance for select
  using (student_id = auth.uid() or public.owns_class(class_id) or public.is_admin());

drop policy if exists "attendance_write" on public.attendance;
create policy "attendance_write" on public.attendance for insert
  with check (public.owns_class(class_id) or public.is_admin());

drop policy if exists "attendance_update" on public.attendance;
create policy "attendance_update" on public.attendance for update
  using (public.owns_class(class_id) or public.is_admin());

drop policy if exists "attendance_delete" on public.attendance;
create policy "attendance_delete" on public.attendance for delete
  using (public.owns_class(class_id) or public.is_admin());

drop policy if exists "assignments_select" on public.assignments;
create policy "assignments_select" on public.assignments for select
  using (public.is_enrolled(class_id) or public.owns_class(class_id) or public.is_admin());

drop policy if exists "assignments_write" on public.assignments;
create policy "assignments_write" on public.assignments for insert
  with check (public.owns_class(class_id) or public.is_admin());

drop policy if exists "assignments_update" on public.assignments;
create policy "assignments_update" on public.assignments for update
  using (public.owns_class(class_id) or public.is_admin());

drop policy if exists "assignments_delete" on public.assignments;
create policy "assignments_delete" on public.assignments for delete
  using (public.owns_class(class_id) or public.is_admin());

drop policy if exists "submissions_select" on public.submissions;
create policy "submissions_select" on public.submissions for select
  using (
    student_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.owns_class(a.class_id)
    )
  );

drop policy if exists "submissions_insert" on public.submissions;
create policy "submissions_insert" on public.submissions for insert
  with check (student_id = auth.uid() or public.is_admin());

drop policy if exists "submissions_update" on public.submissions;
create policy "submissions_update" on public.submissions for update
  using (
    student_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.owns_class(a.class_id)
    )
  );

drop policy if exists "exams_select" on public.exams;
create policy "exams_select" on public.exams for select
  using (public.is_enrolled(class_id) or public.owns_class(class_id) or public.is_admin());

drop policy if exists "exams_write" on public.exams;
create policy "exams_write" on public.exams for insert
  with check (public.owns_class(class_id) or public.is_admin());

drop policy if exists "exams_update" on public.exams;
create policy "exams_update" on public.exams for update
  using (public.owns_class(class_id) or public.is_admin());

drop policy if exists "exams_delete" on public.exams;
create policy "exams_delete" on public.exams for delete
  using (public.owns_class(class_id) or public.is_admin());

drop policy if exists "grades_select" on public.grades;
create policy "grades_select" on public.grades for select
  using (
    student_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.exams e where e.id = exam_id and public.owns_class(e.class_id))
  );

drop policy if exists "grades_write" on public.grades;
create policy "grades_write" on public.grades for insert
  with check (
    public.is_admin()
    or exists (select 1 from public.exams e where e.id = exam_id and public.owns_class(e.class_id))
  );

drop policy if exists "grades_update" on public.grades;
create policy "grades_update" on public.grades for update
  using (
    public.is_admin()
    or exists (select 1 from public.exams e where e.id = exam_id and public.owns_class(e.class_id))
  );

drop policy if exists "ai_insights_select" on public.ai_insights;
create policy "ai_insights_select" on public.ai_insights for select
  using (student_id = auth.uid() or public.teaches_student(student_id) or public.is_admin());

drop policy if exists "ai_insights_insert" on public.ai_insights;
create policy "ai_insights_insert" on public.ai_insights for insert
  with check (student_id = auth.uid() or public.teaches_student(student_id) or public.is_admin());

drop policy if exists "announcements_select" on public.announcements;
create policy "announcements_select" on public.announcements for select
  using (true);

drop policy if exists "announcements_write" on public.announcements;
create policy "announcements_write" on public.announcements for insert
  with check (public.is_admin() or public.is_teacher());

drop policy if exists "announcements_update" on public.announcements;
create policy "announcements_update" on public.announcements for update
  using (public.is_admin() or created_by = auth.uid());

drop policy if exists "announcements_delete" on public.announcements;
create policy "announcements_delete" on public.announcements for delete
  using (public.is_admin() or created_by = auth.uid());

drop policy if exists "contact_insert_public" on public.contact_messages;
create policy "contact_insert_public" on public.contact_messages for insert
  with check (true);

drop policy if exists "contact_select_admin" on public.contact_messages;
create policy "contact_select_admin" on public.contact_messages for select
  using (public.is_admin());

-- ============================================================================
-- Done. Verify: Table Editor should show profiles, courses, classes,
-- enrollments, attendance, assignments, submissions, exams, grades,
-- ai_insights, announcements, contact_messages — and no `users` table.
-- ============================================================================
