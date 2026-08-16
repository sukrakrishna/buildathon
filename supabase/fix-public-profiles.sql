-- ============================================================================
-- FIX: profiles was only readable by *authenticated* users, which silently
-- blocks anonymous visitors from seeing teacher names/avatars anywhere on the
-- public site — the homepage's "Top teachers" section, every course card's
-- instructor field, and the course detail page's instructor info. This is
-- the root cause of "No teachers yet" and courses showing "Staff" on the
-- live site: it was never a data/seeding gap, it was RLS blocking public
-- reads of a table the public pages are supposed to read from, per spec.
--
-- This changes exactly one policy. Doesn't touch any data, doesn't affect
-- writes (still owner/admin-only), doesn't expose anything auth-related
-- (credentials live in Supabase's separate auth.users, never in profiles).
--
-- Run once in the Supabase SQL editor (Project > SQL Editor > New query).
-- ============================================================================

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (true);

-- ============================================================================
-- Done. Verify: an anonymous request (anon/publishable key, no session) to
-- GET /rest/v1/profiles?select=id,full_name,role&role=eq.teacher should now
-- return rows instead of an empty array.
-- ============================================================================
