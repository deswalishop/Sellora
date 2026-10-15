import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRs } from "@/lib/format";
import { productImageUrl } from "@/lib/supabase/storage";
import { ProductRowActions } from "./row-actions";
import { PageHeader, Card, Badge, DataTable, EmptyState } from "@/features/dashboard/ui";

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

  const statusTone = (s: string) =>
    s === "active" ? ("success" as const) : s === "hidden" ? ("attention" as const) : ("neutral" as const);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} product${products.length === 1 ? "" : "s"}`}
        actions={
          <Link
            href="/products/new"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Add product
          </Link>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-neutral-100 px-5 py-4 sm:flex-row sm:items-center">
          <form className="flex flex-1 gap-2" action="/products" method="get">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search products…"
              aria-label="Search products"
              className="h-10 flex-1 rounded-lg border border-neutral-300 px-3.5 text-sm focus:border-neutral-900 focus:outline-none"
            />
            {status && <input type="hidden" name="status" value={status} />}
            <button
              type="submit"
              className="h-10 rounded-lg border border-neutral-300 px-5 text-sm font-medium text-neutral-800 transition hover:border-neutral-500"
            >
              Search
            </button>
          </form>
          <div className="flex gap-1">
            {STATUS_TABS.map((t) => (
              <Link
                key={t.value}
                href={`/products${t.value || q ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(t.value ? { status: t.value } : {}) }).toString()}` : ""}`}
                className={`rounded-md px-3 py-1.5 text-[13px] transition ${
                  status === t.value ? "bg-neutral-100 font-semibold text-neutral-900" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyState title="No products yet" hint="Add your first product and start selling." />
        ) : (
          <DataTable headers={["Product", "Price", "Inventory", "Status", ""]}>
            {products.map((p) => {
              const img = p.product_images?.[0]?.storage_path;
              return (
                <tr key={p.id} className="transition hover:bg-neutral-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={productImageUrl(img, 160)} alt="" className="h-11 w-11 shrink-0 rounded-md border border-neutral-200 object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-neutral-100 text-base font-semibold text-neutral-400">
                          {p.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <Link href={`/products/${p.id}`} className="font-medium text-neutral-900 hover:underline">
                        {p.title}
                      </Link>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-neutral-700">
                    {formatRs(p.sale_price ?? p.regular_price)}
                    {p.sale_price != null && (
                      <span className="ml-2 text-xs text-neutral-400 line-through">{formatRs(p.regular_price)}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {p.stock <= 5 ? (
                      <span className="font-medium text-orange-700">{p.stock} left</span>
                    ) : (
                      <span className="text-neutral-700">{p.stock} in stock</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ProductRowActions id={p.id} status={p.status} />
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Card>
    </div>
  );
}
