"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProductStatus, duplicateProduct, deleteProduct } from "@/features/products/actions";

type Status = "active" | "hidden" | "archived";

/** Row actions: edit / hide-show / duplicate / delete. */
export function ProductRowActions({ id, status }: { id: string; status: Status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.ok) alert(res.error ?? "Something went wrong.");
    router.refresh();
  }

  const linkCls =
    "rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-neutral-100 disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link href={`/products/${id}`} className={`${linkCls} text-neutral-900`}>
        Edit
      </Link>
      {status === "active" ? (
        <button disabled={busy} onClick={() => run(() => updateProductStatus(id, "hidden"))} className={`${linkCls} text-neutral-500`}>
          Hide
        </button>
      ) : (
        <button disabled={busy} onClick={() => run(() => updateProductStatus(id, "active"))} className={`${linkCls} text-emerald-700`}>
          Show
        </button>
      )}
      <button disabled={busy} onClick={() => run(() => duplicateProduct(id))} className={`${linkCls} text-neutral-500`}>
        Duplicate
      </button>
      <button
        disabled={busy}
        onClick={() => run(() => deleteProduct(id), "Delete this product? It will be hidden from your store.")}
        className={`${linkCls} text-red-600`}
      >
        Delete
      </button>
    </div>
  );
}
