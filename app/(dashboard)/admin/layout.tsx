import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/admin/actions";

/** Admin area guard — only platform admins (M1.6). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">ADMIN</span>
        <nav className="flex gap-1 text-sm">
          <a href="/admin" className="rounded-lg px-3 py-2 font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">Overview</a>
          <a href="/admin/sellers" className="rounded-lg px-3 py-2 font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">Sellers</a>
          <a href="/admin/subscriptions" className="rounded-lg px-3 py-2 font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">Subscriptions</a>
        </nav>
      </div>
      {children}
    </div>
  );
}
