"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, signInWithGoogle, type AuthResult } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const initialState: AuthResult = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <Card>
      <h1 className="text-xl font-bold text-neutral-900">Create your account</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Start your 14-day Business trial. No credit card needed.
      </p>

      {state.error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <Input label="Full name" name="fullName" autoComplete="name" placeholder="Ayesha Khan" required />
        <Input label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use 8+ characters for a strong password."
          required
        />
        <Input
          label="Mobile number"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="03XX-XXXXXXX"
          hint="Used for order notifications and trial verification."
        />
        <Input label="Business name" name="businessName" placeholder="e.g. Ayesha's Boutique" required />
        <Button type="submit" loading={pending} size="lg">
          Create account
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-neutral-500">
        <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={signInWithGoogle}>
        <Button variant="secondary" size="lg" type="submit">
          Continue with Google
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-neutral-900 hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
