-- ============================================================================
-- ADD: intervention_plans table — for an already-deployed project.
-- Purely additive: creates one new table + RLS policies. Does not touch,
-- alter, or drop anything that already exists. Safe to run against a live
-- database with real data in it.
--
-- Run once in the Supabase SQL editor (Project > SQL Editor > New query).
-- ============================================================================

create table if not exists public.intervention_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  insight_id uuid references public.ai_insights(id) on delete set null,
  focus_subject text,
  risk_level_at_creation risk_level,
  tasks jsonb not null default '[]',
  source text not null default 'fallback',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_intervention_plans_student on public.intervention_plans(student_id);

alter table public.intervention_plans enable row level security;

drop policy if exists "intervention_plans_select" on public.intervention_plans;
create policy "intervention_plans_select" on public.intervention_plans for select
  using (student_id = auth.uid() or public.teaches_student(student_id) or public.is_admin());

drop policy if exists "intervention_plans_insert" on public.intervention_plans;
create policy "intervention_plans_insert" on public.intervention_plans for insert
  with check (student_id = auth.uid() or public.teaches_student(student_id) or public.is_admin());

drop policy if exists "intervention_plans_update" on public.intervention_plans;
create policy "intervention_plans_update" on public.intervention_plans for update
  using (student_id = auth.uid() or public.teaches_student(student_id) or public.is_admin());

-- ============================================================================
-- Done. Verify: Table Editor should now show intervention_plans alongside
-- your existing tables.
-- ============================================================================
