"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createProduct, updateProduct } from "./actions";
import type { ProductInput } from "./schemas";

export interface ProductFormProps {
  productId?: string;
  initial?: Partial<ProductInput>;
  categories: string[];
}

/** Shared create/edit form (PRD section 14 fields). */
export function ProductForm({ productId, initial, categories }: ProductFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    const emptyToNull = (v: FormDataEntryValue | null) =>
      v === null || String(v).trim() === "" ? null : v;
    const input = {
      title: fd.get("title"),
      description: fd.get("description") ?? "",
      categoryName: fd.get("categoryName") ?? "",
      regularPrice: fd.get("regularPrice"),
      salePrice: emptyToNull(fd.get("salePrice")),
      costPrice: emptyToNull(fd.get("costPrice")),
      sku: fd.get("sku") ?? "",
      stock: fd.get("stock") ?? 0,
      weightGrams: emptyToNull(fd.get("weightGrams")),
      brand: fd.get("brand") ?? "",
      status: fd.get("status") ?? "active",
      isFeatured: fd.get("isFeatured") === "on",
    };
    const res = productId
      ? await updateProduct(productId, input as unknown as ProductInput)
      : await createProduct(input as unknown as ProductInput);
    setPending(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    if (productId) {
      setSaved(true);
    } else {
      router.push(`/products/${res.id}`);
    }
  }

  const v = (k: keyof ProductInput) => (initial?.[k] as string | number | undefined) ?? "";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {saved && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-neutral-900">
          Saved successfully.
        </p>
      )}

      <Input label="Product name" name="title" defaultValue={String(v("title"))} placeholder="e.g. Premium Lawn Suit" required />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-900" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={String(initial?.description ?? "")}
          placeholder="Fabric, sizing, care instructions…"
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-500/60 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-300"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-900" htmlFor="categoryName">
            Category
          </label>
          <input
            id="categoryName"
            name="categoryName"
            list="category-list"
            defaultValue={String(initial?.categoryName ?? "")}
            placeholder="e.g. Women's Fashion"
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-500/60 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
          <datalist id="category-list">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <Input label="Brand (optional)" name="brand" defaultValue={String(v("brand"))} placeholder="e.g. Gul Ahmed" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Input label="Regular price (Rs)" name="regularPrice" type="number" min={1} defaultValue={String(v("regularPrice"))} placeholder="2500" required />
        <Input label="Sale price (Rs)" name="salePrice" type="number" min={1} defaultValue={initial?.salePrice != null ? String(initial.salePrice) : ""} placeholder="Optional" />
        <Input label="Cost price (Rs)" name="costPrice" type="number" min={0} defaultValue={initial?.costPrice != null ? String(initial.costPrice) : ""} placeholder="Optional" />
        <Input label="Stock" name="stock" type="number" min={0} defaultValue={String(initial?.stock ?? 0)} placeholder="50" required />
        <Input label="SKU (optional)" name="sku" defaultValue={String(v("sku"))} placeholder="e.g. LS-001" />
        <Input label="Weight (grams)" name="weightGrams" type="number" min={0} defaultValue={initial?.weightGrams != null ? String(initial.weightGrams) : ""} placeholder="Optional" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-900" htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            defaultValue={String(initial?.status ?? "active")}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-300"
          >
            <option value="active">Active — visible in store</option>
            <option value="hidden">Hidden — not visible</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <label className="flex items-end gap-3 pb-3">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={Boolean(initial?.isFeatured)}
            className="h-5 w-5 rounded accent-emerald-800"
          />
          <span className="text-sm font-medium text-neutral-900">Featured product</span>
        </label>
      </div>

      <Button type="submit" loading={pending} size="lg" className="sm:w-auto">
        {productId ? "Save changes" : "Create product"}
      </Button>
    </form>
  );
}
