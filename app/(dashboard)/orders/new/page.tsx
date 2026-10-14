import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ManualOrderForm, type ProductOption } from "@/features/orders/manual-order-form";

/** Manual order creation (PRD M1.5) — for WhatsApp/Instagram/phone sales. */
export default async function NewOrderPage() {
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

  const { data: products } = await supabase
    .from("products")
    .select("id, title, regular_price, sale_price, stock, product_variants(id, name, price_override, stock)")
    .eq("store_id", storeId)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("title")
    .limit(200);

  const options: ProductOption[] = ((products ?? []) as {
    id: string; title: string; regular_price: number; sale_price: number | null; stock: number;
    product_variants: { id: string; name: string; price_override: number | null; stock: number }[];
  }[]).map((p) => ({
    id: p.id,
    title: p.title,
    price: p.sale_price ?? p.regular_price,
    stock: p.stock,
    variants: p.product_variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price_override ?? p.sale_price ?? p.regular_price,
      stock: v.stock,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-sm font-medium text-muted hover:text-ink">← Orders</Link>
        <h1 className="mt-1 text-2xl font-bold text-ink">New manual order</h1>
        <p className="mt-1 text-sm text-muted">
          Record a sale that happened on WhatsApp, Instagram, or phone.
        </p>
      </div>
      {options.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <p className="font-semibold text-ink">No products yet</p>
          <p className="mt-1 text-sm text-muted">Add products before creating manual orders.</p>
          <Link href="/products/new" className="mt-4 inline-block text-sm font-semibold text-emerald-950 hover:underline">
            Add a product →
          </Link>
        </div>
      ) : (
        <ManualOrderForm products={options} />
      )}
    </div>
  );
}
