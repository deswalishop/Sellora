import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/features/admin/actions";
import { AdminRowActions } from "@/features/admin/admin-ui";

/** Admin: sellers + their stores (M1.6). */
export default async function AdminSellers() {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/");
  const supabase = await createClient();

  const { data: sellers } = await supabase
    .from("profiles")
    .select("id, full_name, phone, created_at, is_admin")
    .order("created_at", { ascending: false })
    .limit(100);
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug, status, owner_id, created_at");

  const storeByOwner = new Map<string, { id: string; name: string; slug: string; status: string }[]>();
  for (const st of (stores ?? []) as { id: string; name: string; slug: string; status: string; owner_id: string }[]) {
    const list = storeByOwner.get(st.owner_id) ?? [];
    list.push(st);
    storeByOwner.set(st.owner_id, list);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Sellers</h1>
      <p className="mt-1 text-sm text-neutral-500">{(sellers ?? []).length} registered</p>
      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200/70 bg-white">
        <ul className="divide-y divide-slate-100">
          {((sellers ?? []) as { id: string; full_name: string | null; phone: string | null; created_at: string; is_admin: boolean }[]).map((p) => {
            const theirStores = storeByOwner.get(p.id) ?? [];
            return (
              <li key={p.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {p.full_name ?? "—"}
                      {p.is_admin && <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-800">ADMIN</span>}
                    </p>
                    <p className="text-xs text-neutral-500" dir="ltr">{p.phone ?? ""} · joined {new Date(p.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
                {theirStores.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {theirStores.map((st) => (
                      <AdminRowActions key={st.id} storeId={st.id} storeName={st.name} storeSlug={st.slug} storeStatus={st.status} />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
