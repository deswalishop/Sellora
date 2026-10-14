import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRs } from "@/lib/format";
import { productImageUrl } from "@/lib/supabase/storage";
import { ProductRowActions } from "./row-actions";

interface ProductRow {
  id: string;
  title: string;
  regular_price: number;
  sale_price: number | null;
  stock: number;
  status: "active" | "hidden" | "archived";
  product_images: { storage_path: string }[];
}

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "hidden", label: "Hidden" },
  { value: "archived", label: "Archived" },
] as const;

/** Product list: search, status filter, quick actions (PRD section 14). */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!store) redirect("/onboarding");
  const storeId = (store as { id: string }).id;

  let query = supabase
    .from("products")
    .select("id, title, regular_price, sale_price, stock, status, product_images(storage_path)")
    .eq("store_id", storeId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (q.trim()) query = query.ilike("title", `%${q.trim()}%`);
  if (status) query = query.eq("status", status);
  const { data } = await query;
  const products = (data ?? []) as ProductRow[];

  const statusBadge = (s: string) =>
    s === "active"
      ? "bg-brand-mint text-emerald-950"
      : s === "hidden"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-200 text-slate-600";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Products</h1>
          <p className="mt-1 text-sm text-muted">{products.length} product{products.length === 1 ? "" : "s"}</p>
        </div>
        <Link href="/products/new">
          <Button className="sm:w-auto">+ Add product</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="flex-1" action="/products">
          <Input label="" name="q" defaultValue={q} placeholder="Search products…" aria-label="Search products" />
          {status && <input type="hidden" name="status" value={status} />}
        </form>
        <div className="flex gap-2">
          {STATUS_TABS.map((t) => (
            <Link
              key={t.value}
              href={`/products${t.value || q ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(t.value ? { status: t.value } : {}) }).toString()}` : ""}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                status === t.value ? "bg-emerald-950 text-white" : "bg-white text-muted border border-slate-200 hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <p className="font-semibold text-ink">No products yet</p>
          <p className="mt-1 text-sm text-muted">Add your first product and start selling.</p>
          <Link href="/products/new" className="mt-4 inline-block">
            <Button className="sm:w-auto">+ Add product</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {products.map((p) => {
            const img = p.product_images?.[0]?.storage_path;
            return (
              <div key={p.id} className="flex items-center gap-4 border-b border-slate-100 p-4 last:border-0">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={productImageUrl(img, 160)} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-canvas text-lg font-bold text-muted">
                    {(p.title as string).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatRs(p.sale_price ?? p.regular_price)}
                    {p.stock <= 5 && <span className="ml-2 font-medium text-amber-700">Only {p.stock} left</span>}
                    {p.stock > 5 && <span className="ml-2">Stock: {p.stock}</span>}
                  </p>
                </div>
                <span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline ${statusBadge(p.status)}`}>
                  {p.status}
                </span>
                <ProductRowActions id={p.id} status={p.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
