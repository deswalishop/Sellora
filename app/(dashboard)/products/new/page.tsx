import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ProductForm } from "@/features/products/product-form";

/** New product — images & variants are added on the edit page after creation. */
export default async function NewProductPage() {
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

  const { data: cats } = await supabase
    .from("categories")
    .select("name")
    .eq("store_id", storeId)
    .order("name");
  const categories = ((cats ?? []) as { name: string }[]).map((c) => c.name);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/products" className="text-sm font-medium text-neutral-500 hover:text-neutral-900">
          ← Back to products
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">Add product</h1>
      </div>
      <Card>
        <ProductForm categories={categories} />
      </Card>
    </div>
  );
}
