"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error: string | null; success: boolean };

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in.", success: false };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName) return { error: "Name can't be empty.", success: false };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, bio: bio || null, phone: phone || null })
    .eq("id", user.id);

  if (error) return { error: error.message, success: false };

  revalidatePath("/dashboard/profile");
  return { error: null, success: true };
}
