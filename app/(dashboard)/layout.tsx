import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/features/auth/actions";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/orders", label: "Orders" },
  { href: "/products", label: "Products" },
  { href: "/customers", label: "Customers" },
  { href: "/store", label: "Store" },
  { href: "/marketing", label: "Marketing" },
  { href: "/whatsapp", label: "WhatsApp" },
  { href: "/analytics", label: "Analytics" },
  { href: "/payments", label: "Payments" },
  { href: "/coupons", label: "Coupons" },
  { href: "/staff", label: "Staff" },
  { href: "/settings", label: "Settings" },
];

/** Seller dashboard shell (PRD section 12). Only Products is functional in M1.3. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!store) redirect("/onboarding");
  const storeName = (store as { name: string }).name;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-lg font-bold tracking-tight text-emerald-950">Sellora</p>
          <p className="mt-0.5 truncate text-xs text-muted">{storeName}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-canvas hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-muted transition hover:bg-red-50 hover:text-red-700"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <p className="font-bold text-emerald-950">Sellora</p>
          <Link href="/products" className="text-sm font-medium text-muted">
            Products
          </Link>
        </div>
      </header>

      <main className="md:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
