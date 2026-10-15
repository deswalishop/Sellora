import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashNav } from "@/features/dashboard/dash-nav";
import { signOutAction } from "@/features/auth/actions";

/**
 * Shopify-admin-style seller shell: slim top bar, icon sidebar with grouped
 * nav, light-gray content canvas.
 */
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
  const s = store as { id: string; name: string; slug: string };

  return (
    <div className="min-h-screen bg-[#f1f1f1] text-neutral-900 antialiased">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-sm font-bold text-white">
          S
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{s.name}</p>
          <p className="text-xs leading-tight text-neutral-500">sellora.com</p>
        </div>
        <div className="mx-auto hidden max-w-md flex-1 md:block">
          <div className="flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-neutral-100 px-3 text-sm text-neutral-500">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            Search
            <kbd className="ml-auto rounded border border-neutral-300 bg-white px-1.5 text-[11px]">⌘K</kbd>
          </div>
        </div>
        <a
          href={`/s/${s.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 md:ml-0 md:flex"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>
          View store
        </a>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white px-3 py-4 md:block">
          <DashNav />
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-neutral-200 bg-white md:hidden">
        <DashNav mobile />
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  );
}
