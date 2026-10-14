import { createClient as createAnonClient } from "./server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — BYPASSES RLS. Server-only.
 *
 * Allowed uses only:
 *  - public order tracking (order number + phone lookup, rate-limited)
 *  - cron jobs (trial expiry / auto-downgrade)
 *  - admin panel actions (Phase 1 M1.6)
 *
 * NEVER import from a client component. NEVER expose the key to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export { createAnonClient };
