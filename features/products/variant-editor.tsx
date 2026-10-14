"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveVariants } from "./actions";
import type { VariantInput } from "./schemas";

interface Row extends VariantInput {
  key: string;
}

function blankRow(): Row {
  return {
    key: Math.random().toString(36).slice(2),
    option1: "",
    option2: "",
    priceOverride: null,
    stock: 0,
    sku: "",
  };
}

/** Variant matrix editor (PRD section 15): Size / Color / custom options. */
export function VariantEditor({
  productId,
  initial,
}: {
  productId: string;
  initial: VariantInput[];
}) {
  const [rows, setRows] = useState<Row[]>(
    initial.length > 0
      ? initial.map((v) => ({ ...v, key: Math.random().toString(36).slice(2) }))
      : [blankRow()]
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const setRow = (key: string, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setSaved(false);
    setError(null);
  };

  async function save() {
    setPending(true);
    setError(null);
    // Drop fully-empty rows
    const payload = rows
      .filter((r) => r.option1.trim() || r.option2.trim())
      .map(({ key: _key, ...rest }) => rest);
    const res = await saveVariants(productId, payload);
    setPending(false);
    if (!res.ok) {
      setError(res.error ?? "Could not save variants.");
      return;
    }
    setSaved(true);
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {saved && (
        <p className="rounded-xl bg-brand-mint px-4 py-3 text-sm text-emerald-950">
          Variants saved.
        </p>
      )}
      {rows.map((r) => (
        <div
          key={r.key}
          className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-canvas p-3 sm:grid-cols-6"
        >
          <Input
            label="Option 1"
            value={r.option1}
            onChange={(e) => setRow(r.key, { option1: e.target.value })}
            placeholder="e.g. XL"
            className="sm:col-span-1"
          />
          <Input
            label="Option 2"
            value={r.option2}
            onChange={(e) => setRow(r.key, { option2: e.target.value })}
            placeholder="e.g. Black"
            className="sm:col-span-1"
          />
          <Input
            label="Price (Rs)"
            type="number"
            min={1}
            value={r.priceOverride ?? ""}
            onChange={(e) =>
              setRow(r.key, {
                priceOverride: e.target.value ? parseInt(e.target.value, 10) : null,
              })
            }
            placeholder="Same as product"
            className="sm:col-span-1"
          />
          <Input
            label="Stock"
            type="number"
            min={0}
            value={String(r.stock)}
            onChange={(e) => setRow(r.key, { stock: parseInt(e.target.value, 10) || 0 })}
            className="sm:col-span-1"
          />
          <Input
            label="SKU"
            value={r.sku ?? ""}
            onChange={(e) => setRow(r.key, { sku: e.target.value })}
            placeholder="Optional"
            className="sm:col-span-1"
          />
          <div className="flex items-end sm:col-span-1">
            <button
              type="button"
              onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
              className="h-11 w-full rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" className="sm:w-auto" onClick={() => setRows((rs) => [...rs, blankRow()])}>
          + Add variant
        </Button>
        <Button className="sm:w-auto" loading={pending} onClick={save}>
          Save variants
        </Button>
      </div>
      <p className="text-xs text-muted">
        Leave price empty to use the product&apos;s price. Variants with no options are ignored.
      </p>
    </div>
  );
}
