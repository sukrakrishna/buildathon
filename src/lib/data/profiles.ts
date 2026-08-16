import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type MiniProfile = { id: string; full_name: string; avatar_url: string | null; role: string };

export async function getProfilesMap(
  supabase: SupabaseClient<Database>,
  ids: Array<string | null | undefined>
): Promise<Map<string, MiniProfile>> {
  const uniqueIds = [...new Set(ids.filter((id): id is string => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const { data } = await supabase.from("profiles").select("id, full_name, avatar_url, role").in("id", uniqueIds);
  return new Map((data ?? []).map((p) => [p.id, p]));
}
