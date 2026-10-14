"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { adminSuspendStore } from "@/features/admin/actions";

/** Per-store admin actions: suspend/reactivate + storefront link. */
export function AdminRowActions({
  storeId,
  storeName,
  storeSlug,
  storeStatus,
}: {
  storeId: string;
  storeName: string;
  storeSlug: string;
  storeStatus: string;
}) {
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(storeStatus);
  const [error, setError] = useState<string | null>(null);
  const suspended = status === "suspended";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2">
        <Link href={`/s/${storeSlug}`} target="_blank" className="font-semibold text-ink hover:underline">
          {storeName}
        </Link>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${suspended ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
          {status}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await adminSuspendStore({ storeId, suspend: !suspended });
              if (!res.ok) setError(res.error);
              else setStatus(suspended ? "active" : "suspended");
            })
          }
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${suspended ? "bg-emerald-950 text-white" : "border border-red-300 text-red-700 hover:bg-red-50"}`}
        >
          {suspended ? "Reactivate" : "Suspend"}
        </button>
      </div>
    </div>
  );
}
