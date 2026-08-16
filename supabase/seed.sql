-- ============================================================================
-- Optional demo data — run after schema.sql (or reset-and-apply.sql).
-- Safe to re-run. Courses are seeded without a teacher_id (unassigned) since
-- real teacher accounts only exist once someone registers — assign a teacher
-- to each from Admin > Courses once you have one.
-- ============================================================================

insert into public.courses (title, slug, description, category, level, is_published, rating)
values
  ('Intro to Algorithms', 'intro-to-algorithms', 'Foundational algorithms and data structures: sorting, searching, graphs, and complexity analysis.', 'Computer Science', 'beginner', true, 4.6),
  ('Calculus I', 'calculus-i', 'Limits, derivatives, and integrals with applications to physics and engineering.', 'Mathematics', 'beginner', true, 4.4),
  ('Modern World History', 'modern-world-history', 'A survey of global events from the 18th century to today.', 'History', 'intermediate', true, 4.2),
  ('Organic Chemistry', 'organic-chemistry', 'Structure, properties, and reactions of organic compounds.', 'Science', 'advanced', true, 4.0),
  ('Creative Writing Workshop', 'creative-writing-workshop', 'Develop your voice across fiction, poetry, and personal essay.', 'Arts', 'beginner', true, 4.8),
  ('Intro to Economics', 'intro-to-economics', 'Micro and macroeconomic principles for everyday decision-making.', 'Social Science', 'beginner', true, 4.3)
on conflict (slug) do nothing;

insert into public.announcements (title, body)
values
  ('Welcome to the new semester', 'Course registration is now open. Browse the catalog and enroll in your first class today.'),
  ('AI-powered progress tracking', 'Your dashboard now surfaces personalized study recommendations based on your attendance, assignments, and exam scores.'),
  ('Office hours updated', 'Check your course pages for each instructor''s latest office hours and contact info.')
on conflict do nothing;

-- ============================================================================
-- After seeding, sign up a teacher account and assign it to a class from
-- Admin > Courses / Admin > Classes so students have something to enroll in.
-- ============================================================================
