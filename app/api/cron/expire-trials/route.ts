import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/cron/expire-trials
 * Downgrades expired trials to Free (D5: excess products hidden, never deleted).
 * Protect with CRON_SECRET bearer token; schedule daily via Vercel Cron or any scheduler.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("expire_trials");
  if (error) {
    return NextResponse.json({ error: "expiry failed", detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, result: data });
}
