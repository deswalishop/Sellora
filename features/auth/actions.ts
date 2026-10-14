"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "./schemas";

export interface AuthResult {
  error?: string;
}

function firstError(parseResult: { success: false; error: { issues: { message?: string }[] } }): string {
  return parseResult.error.issues[0]?.message ?? "Please check your input";
}

/** Email/password sign-up. Profile row is auto-created by the DB trigger (migration 0002). */
export async function signUpAction(
  _prev: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: firstError(parsed) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone || null,
        business_name: parsed.data.businessName,
      },
    },
  });

  if (error) return { error: error.message };
  // If email confirmation is ON, the user lands here to check their inbox.
  redirect("/login?check-email=1");
}

/** Email/password sign-in. */
export async function signInAction(
  _prev: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: firstError(parsed) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { error: error.message };
  // Dashboard overview; the (dashboard) layout sends storeless users to onboarding.
  redirect("/overview");
}

/** Google OAuth sign-in. */
export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

/** Sign out everywhere. */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
