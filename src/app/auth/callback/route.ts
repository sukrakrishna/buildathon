import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  teacher: "/dashboard",
  student: "/dashboard",
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      return NextResponse.redirect(`${origin}${next || ROLE_HOME[profile?.role ?? "student"]}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
