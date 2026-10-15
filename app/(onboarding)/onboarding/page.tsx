import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/features/onboarding/wizard";

/**
 * Seller onboarding (PRD section 11) — 5 steps, under 10 minutes.
 * Requires auth. Sellers who already have a store skip ahead
 * (dashboard takes over in M1.5).
 */
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: stores } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1);
  if (stores && stores.length > 0) redirect("/overview");

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold tracking-tight text-neutral-900">Sellora</p>
          <p className="mt-1 text-sm text-neutral-500">Let&apos;s get your store online.</p>
        </div>
        <OnboardingWizard
          initialBusinessName={(user.user_metadata?.business_name as string) ?? ""}
          initialWhatsapp={(user.user_metadata?.phone as string) ?? ""}
        />
      </div>
    </main>
  );
}
