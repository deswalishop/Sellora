"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signInAction, signInWithGoogle, type AuthResult } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const initialState: AuthResult = {};

function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const searchParams = useSearchParams();
  const checkEmail = searchParams.get("check-email") === "1";
  const oauthError = searchParams.get("error") === "oauth";

  return (
    <>
      {checkEmail && (
        <p className="mt-4 rounded-xl bg-brand-mint px-4 py-3 text-sm text-emerald-950">
          Account created! Please check your email to confirm, then sign in.
        </p>
      )}
      {(state.error || oauthError) && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error ?? "Google sign-in failed. Please try again."}
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <Input label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        <Input label="Password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
        <Button type="submit" loading={pending} size="lg">
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={signInWithGoogle}>
        <Button variant="secondary" size="lg" type="submit">
          Continue with Google
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New to Sellora?{" "}
        <Link href="/signup" className="font-semibold text-emerald-950 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Card>
      <h1 className="text-xl font-bold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Sign in to manage your store.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </Card>
  );
}
