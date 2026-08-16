import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getCurrentUser(): Promise<{ id: string; email: string | null; profile: Profile } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;

  return { id: user.id, email: user.email ?? null, profile };
}

export async function requireUser() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(roles: Array<Profile["role"]>) {
  const session = await requireUser();
  if (!roles.includes(session.profile.role)) {
    redirect(session.profile.role === "admin" ? "/admin" : "/dashboard");
  }
  return session;
}
