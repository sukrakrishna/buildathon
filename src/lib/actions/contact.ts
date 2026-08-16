"use server";

import { createClient } from "@/lib/supabase/server";

export type ContactFormState = { error: string | null; success: boolean };

export async function submitContactAction(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { error: "Please fill in your name, email, and message.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({ name, email, subject, message });

  if (error) return { error: error.message, success: false };
  return { error: null, success: true };
}
