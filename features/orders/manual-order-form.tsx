"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRs } from "@/lib/format";
import { createManualOrder } from "@/features/orders/actions";

export interface ProductOption {
  id: string;
  title: string;
  price: number;
  stock: number;
  variants: { id: string; name: string; price: number; stock: number }[];
}

interface Line {
  key: string;
  productId: string;
  variantId: string | null;
  title: string;
  variantName: string | null;
  unitPrice: number;
  qty: number;
  maxStock: number;
}

const SOURCES = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "phone", label: "Phone call" },
  { value: "manual", label: "Walk-in / other" },
] as const;

/** Manual order form — for sales that happened on WhatsApp/Instagram/phone. */
export function ManualOrderForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [picker, setPicker] = useState("");
  const [source, setSource] = useState<(typeof SOURCES)[number]["value"]>("whatsapp");
  const [payment, setPayment] = useState("cod");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(() => lines.reduce((a, l) => a + l.unitPrice * l.qty, 0), [lines]);

  function addLine() {
    const [pid, vid] = picker.split("::");
    const p = products.find((x) => x.id === pid);
    if (!p) return;
    const v = p.variants.find((x) => x.id === vid);
    const key = `${pid}::${vid ?? ""}`;
    if (lines.some((l) => l.key === key)) return;
    setLines((ls) => [
      ...ls,
      {
        key,
        productId: pid,
        variantId: vid || null,
        title: p.title,
        variantName: v?.name ?? null,
        unitPrice: v ? v.price : p.price,
        qty: 1,
        maxStock: v ? v.stock : p.stock,
      },
    ]);
    setPicker("");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lines.length === 0) {
      setError("Add at least one product.");
      return;
    }
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createManualOrder({
      fullName: fd.get("fullName"),
      phone: fd.get("phone"),
      city: fd.get("city"),
      address: fd.get("address"),
      paymentMethod: payment,
      source,
      notes: fd.get("notes") || "",
      items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
    });
    if (!res.ok) {
      setPending(false);
      setError(res.error);
      return;
    }
    router.push("/orders");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-bold text-ink">Products</h2>
          <div className="flex gap-2">
            <select
              value={picker}
              onChange={(e) => setPicker(e.target.value)}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-ink focus:border-brand-light focus:outline-none"
            >
              <option value="">Select a product…</option>
              {products.map((p) => (
                <optgroup key={p.id} label={`${p.title} — ${formatRs(p.price)}`}>
                  <option value={`${p.id}::`}>{p.title} (base) — {p.stock} in stock</option>
                  {p.variants.map((v) => (
                    <option key={v.id} value={`${p.id}::${v.id}`}>
                      {p.title} — {v.name} ({formatRs(v.price)}, {v.stock} in stock)
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <Button type="button" onClick={addLine} disabled={!picker}>
              Add
            </Button>
          </div>
          {lines.length > 0 && (
            <ul className="mt-4 space-y-2">
              {lines.map((l) => (
                <li key={l.key} className="flex items-center gap-3 rounded-xl bg-canvas p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">
                      {l.title}{l.variantName && <span className="text-muted"> ({l.variantName})</span>}
                    </p>
                    <p className="text-xs text-muted">{formatRs(l.unitPrice)} each · {l.maxStock} in stock</p>
                  </div>
                  <div className="flex items-center rounded-full border border-slate-300 bg-white">
                    <button type="button" onClick={() => setLines((ls) => ls.map((x) => x.key === l.key ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} className="flex h-7 w-7 items-center justify-center font-bold text-muted">−</button>
                    <span className="w-7 text-center text-xs font-bold">{l.qty}</span>
                    <button type="button" onClick={() => setLines((ls) => ls.map((x) => x.key === l.key ? { ...x, qty: Math.min(x.maxStock, x.qty + 1) } : x))} className="flex h-7 w-7 items-center justify-center font-bold text-muted">+</button>
                  </div>
                  <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="text-xs font-medium text-red-600 hover:underline">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-bold text-ink">Customer</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Full name" name="fullName" placeholder="e.g. Ahmed Raza" required />
              <Input label="Mobile number" name="phone" placeholder="03XX-XXXXXXX" required />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="City" name="city" placeholder="e.g. Karachi" required />
              <Input label="Address" name="address" placeholder="House, street, area…" required />
            </div>
            <Input label="Notes (optional)" name="notes" placeholder="Anything about this order…" />
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:sticky lg:top-6">
          <h2 className="mb-4 font-bold text-ink">Order details</h2>
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-ink">Where did this sale happen?</p>
            <div className="grid grid-cols-2 gap-2">
              {SOURCES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSource(s.value)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${source === s.value ? "border-emerald-950 bg-emerald-950 text-white" : "border-slate-200 text-muted hover:text-ink"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-ink">Payment method</p>
            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-ink focus:border-brand-light focus:outline-none"
            >
              <option value="cod">Cash on Delivery</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="raast">Raast</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
            </select>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-4 text-base font-bold">
            <span className="text-ink">Total</span>
            <span className="text-emerald-950">{formatRs(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Delivery fee: {formatRs(0)} (add manually in notes if needed)</p>
          <Button type="submit" loading={pending} size="lg" className="mt-4">
            Create order
          </Button>
        </div>
      </div>
    </form>
  );
}
