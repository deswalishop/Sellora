import Link from "next/link";
import { WhatsAppIcon, InstagramIcon } from "@/features/storefront/social-buttons";

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 text-white">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </span>
      <span className={`text-xl font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>Sellora</span>
    </span>
  );
}

function Stars() {
  return (
    <span className="flex gap-0.5" aria-label="4.9 out of 5 stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

/** Sellora marketing landing page — matches the approved design concept. */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
            <a href="#features" className="transition hover:text-ink">Features</a>
            <a href="#pricing" className="transition hover:text-ink">Pricing</a>
            <a href="#templates" className="transition hover:text-ink">Templates</a>
            <a href="#demo" className="transition hover:text-ink">Demo Store</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-ink sm:block">
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-950/90"
            >
              Start Free →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-900">
              🇵🇰 Built for Pakistani Sellers
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Turn your WhatsApp &amp; Instagram into a complete{" "}
              <span className="text-emerald-700">online store</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              Sell products, take orders, collect payments and manage everything — all in one
              place. No coding. No complicated setup. Just growth.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-emerald-950 px-8 py-3.5 font-semibold text-white transition hover:bg-emerald-950/90"
              >
                Start Free →
              </Link>
              <a
                href="#demo"
                className="flex items-center gap-2 rounded-full border border-slate-300 px-8 py-3.5 font-semibold text-ink transition hover:border-emerald-950"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                View Demo Store
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["AK", "BR", "SM", "FA"].map((n) => (
                    <span key={n} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-100 text-xs font-bold text-emerald-900">
                      {n}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted">
                  <span className="font-bold text-ink">10,000+ Pakistani sellers</span>
                  <br />are growing with Sellora
                </p>
              </div>
              <div className="text-sm text-muted">
                <Stars />
                <p className="mt-1"><span className="font-bold text-ink">4.9/5</span> average rating</p>
              </div>
            </div>
          </div>

          {/* Demo store browser mockup */}
          <div id="demo" className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(6,95,70,0.12)]">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="mx-auto rounded-md bg-white px-4 py-1 text-xs text-muted">sellora.pk</span>
                <span className="w-10" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-950 text-xs font-bold text-white">ZM</span>
                    <div>
                      <p className="text-sm font-bold">Zara&apos;s Modest ✓</p>
                      <p className="text-[11px] text-muted">Modest Fashion for Modern Women</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-muted">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  </div>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-6 text-white">
                  <p className="text-[11px] uppercase tracking-widest text-emerald-200">New Collection</p>
                  <p className="mt-2 font-serif text-3xl font-bold leading-tight">Grace<br />in Every<br />Detail</p>
                  <p className="mt-2 text-xs text-emerald-100">Modest fashion for your everyday story.</p>
                  <span className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-xs font-bold text-emerald-950">Shop Now →</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Cash on Delivery", "All over Pakistan"],
                    ["Easy Returns", "7 Days Policy"],
                    ["Free Delivery", "On orders above Rs. 3,000"],
                  ].map(([t, s]) => (
                    <div key={t} className="rounded-lg bg-canvas p-2.5">
                      <p className="text-[11px] font-bold">{t}</p>
                      <p className="text-[10px] text-muted">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Floating feature pills */}
            <div className="absolute -right-3 top-16 hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-lg sm:block">
              <div className="flex items-center gap-2">
                <span className="text-[#25D366]"><WhatsAppIcon size={22} /></span>
                <div><p className="text-xs font-bold">Automate</p><p className="text-[11px] text-muted">WhatsApp Orders</p></div>
              </div>
            </div>
            <div className="absolute -right-6 top-1/2 hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-lg sm:block">
              <div className="flex items-center gap-2">
                <span className="text-pink-600"><InstagramIcon size={22} /></span>
                <div><p className="text-xs font-bold">Showcase on</p><p className="text-[11px] text-muted">Instagram</p></div>
              </div>
            </div>
            <div className="absolute -right-3 bottom-16 hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-lg sm:block">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </span>
                <div><p className="text-xs font-bold">Accept Online</p><p className="text-[11px] text-muted">Payments</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dashboard preview ───────────────────────────── */}
      <section className="bg-canvas py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-emerald-700">Seller Dashboard</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Your store. Everywhere your customers are.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">
            Orders, products, customers and payments — managed from one beautiful dashboard, on any device.
          </p>

          <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(6,95,70,0.10)]">
            <div className="flex">
              <div className="hidden w-48 shrink-0 border-r border-slate-100 p-4 sm:block">
                <p className="px-2 py-2 text-sm font-bold text-emerald-950">Sellora</p>
                {["Overview", "Orders", "Products", "Customers", "Store", "Marketing", "WhatsApp", "Analytics", "Payments", "Settings"].map((n, i) => (
                  <p key={n} className={`rounded-lg px-3 py-1.5 text-xs ${i === 0 ? "bg-emerald-50 font-semibold text-emerald-900" : "text-muted"}`}>{n}</p>
                ))}
              </div>
              <div className="flex-1 p-5">
                <p className="font-bold">Good morning, Ayesha! 👋</p>
                <p className="text-xs text-muted">Your store is performing well. Here&apos;s a quick overview.</p>
                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    ["Total Sales", "Rs. 248,430", "+12% from last month"],
                    ["Orders", "512", "+18% from last month"],
                    ["Customers", "346", "+25% from last month"],
                    ["Conversion Rate", "4.8%", "+1.2% from last month"],
                  ].map(([l, v, d]) => (
                    <div key={l} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                      <p className="text-[11px] text-muted">{l}</p>
                      <p className="mt-1 text-lg font-bold">{v}</p>
                      <p className="text-[11px] font-semibold text-emerald-700">↗ {d}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 p-4 lg:col-span-2">
                    <p className="text-xs font-semibold">Sales Overview</p>
                    <div className="mt-3 flex h-24 items-end gap-1.5">
                      {[35, 50, 42, 65, 55, 78, 92].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-emerald-900 to-emerald-400/80" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs font-semibold">Recent Orders</p>
                    {[
                      ["#SLR-1082", "Rs. 4,500", "Preparing"],
                      ["#SLR-1081", "Rs. 2,200", "Confirmed"],
                      ["#SLR-1080", "Rs. 3,800", "Shipped"],
                    ].map(([n, t, s]) => (
                      <div key={n} className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold">{n}</span>
                        <span className="text-muted">{t}</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section id="features" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to sell <span className="text-emerald-700">online</span>
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <span className="text-[#25D366]"><WhatsAppIcon size={26} /></span>,
                t: "WhatsApp Integration",
                d: "Auto replies & order management. Confirm orders on WhatsApp before dispatch.",
              },
              {
                icon: <span className="text-pink-600"><InstagramIcon size={26} /></span>,
                t: "Instagram Store",
                d: "Turn followers into customers. Share products straight to Instagram.",
              },
              {
                icon: (
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </span>
                ),
                t: "Online Payments",
                d: "Cards, Bank Transfer, Raast, Easypaisa, JazzCash — plus Cash on Delivery.",
              },
              {
                icon: (
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
                  </span>
                ),
                t: "Beautiful Templates",
                d: "Launch a professional store in minutes. No coding, no designer needed.",
              },
            ].map((f) => (
              <div key={f.t} className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_8px_30px_rgba(6,95,70,0.06)]">
                {f.icon}
                <p className="mt-4 font-bold">{f.t}</p>
                <p className="mt-1.5 text-sm text-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ──────────────────────────────── */}
      <section id="pricing" className="bg-canvas py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Simple pricing, in rupees</h2>
          <p className="mt-2 text-center text-muted">Start free. Upgrade when you grow.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Free", "Rs. 0", "10 products · Sellora subdomain · WhatsApp orders", false],
              ["Business", "Rs. 2,499/mo", "Unlimited products · 0% commission · Priority support", true],
              ["Pro", "Rs. 4,999/mo", "Everything in Business · AI tools · Advanced analytics", false],
            ].map(([n, p, d, hot]) => (
              <div key={n as string} className={`rounded-3xl border bg-white p-6 ${hot ? "border-emerald-900 shadow-[0_16px_40px_rgba(6,95,70,0.15)]" : "border-slate-200/70"}`}>
                {hot ? <span className="rounded-full bg-emerald-950 px-3 py-1 text-[11px] font-bold text-white">MOST POPULAR</span> : null}
                <p className={`font-bold ${hot ? "mt-3" : ""}`}>{n}</p>
                <p className="mt-1 text-2xl font-bold">{p}</p>
                <p className="mt-2 text-sm text-muted">{d}</p>
                <Link href="/signup" className={`mt-5 block rounded-full py-2.5 text-center text-sm font-semibold ${hot ? "bg-emerald-950 text-white" : "border border-slate-300 text-ink"}`}>
                  Start Free
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            From chat to checkout — <span className="text-emerald-700">in minutes.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Join thousands of Pakistani sellers turning their WhatsApp and Instagram into real businesses.
          </p>
          <Link href="/signup" className="mt-8 inline-block rounded-full bg-emerald-950 px-10 py-4 font-semibold text-white transition hover:bg-emerald-950/90">
            Start Free →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row">
          <Logo />
          <p className="text-sm text-muted">A WhatsApp commerce platform for Pakistani sellers.</p>
          <div className="flex gap-6 text-sm font-medium text-muted">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
            <Link href="/login" className="hover:text-ink">Login</Link>
            <Link href="/signup" className="hover:text-ink">Start Free</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
