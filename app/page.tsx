import Link from "next/link";

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d7a5f] text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </span>
      <span className="text-xl font-bold tracking-tight text-neutral-900">sellora</span>
    </span>
  );
}

/** Shopify.com-style marketing landing page for Sellora. */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-[15px] text-neutral-800 lg:flex">
            <a href="#features" className="hover:text-neutral-500">Features</a>
            <a href="#how" className="hover:text-neutral-500">How it works</a>
            <a href="#pricing" className="hover:text-neutral-500">Pricing</a>
            <a href="#faq" className="hover:text-neutral-500">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden text-[15px] font-medium sm:block">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-neutral-900 px-5 py-2.5 text-[15px] font-medium text-white transition hover:bg-neutral-700"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
            Turn your WhatsApp &amp; Instagram into a complete online store
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-500">
            Sellora gives Pakistani sellers a Shopify-style store, orders, and customer management —
            built for Cash on Delivery, Easypaisa and JazzCash.
          </p>
          <form
            action="/signup"
            method="get"
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Enter your email address"
              aria-label="Email address"
              className="h-14 flex-1 rounded-xl border border-neutral-400 px-5 text-base focus:border-neutral-900 focus:outline-none"
            />
            <button
              type="submit"
              className="h-14 rounded-xl bg-[#0d7a5f] px-8 text-base font-medium text-white transition hover:bg-[#0a644e]"
            >
              Start free trial
            </button>
          </form>
          <p className="mt-3 text-[13px] text-neutral-500">
            Try Sellora free for 14 days, no credit card required.
          </p>
        </div>

        {/* Product mockup */}
        <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-neutral-200 shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
          <div className="flex items-center gap-1.5 border-b border-neutral-200 bg-neutral-100 px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-neutral-300" />
            <span className="h-3 w-3 rounded-full bg-neutral-300" />
            <span className="h-3 w-3 rounded-full bg-neutral-300" />
            <span className="ml-3 rounded-md bg-white px-3 py-1 text-xs text-neutral-500">yourstore.sellora.com</span>
          </div>
          <div className="grid sm:grid-cols-2">
            <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#0d7a5f] to-[#084c3c] text-7xl font-semibold text-white/90">
              S
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#0d7a5f]">Your store</p>
              <p className="mt-2 text-2xl font-medium">Beautiful storefront, ready in minutes</p>
              <p className="mt-2 text-[15px] text-neutral-500">
                Add products, share your link on WhatsApp, and take COD orders — no website skills needed.
              </p>
              <span className="mt-5 inline-block w-fit rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white">
                Shop now
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos strip ─────────────────────────────────── */}
      <section className="border-y border-neutral-200 bg-neutral-50 py-8">
        <p className="text-center text-sm text-neutral-500">
          Built for Pakistan&apos;s WhatsApp, Instagram &amp; Facebook sellers
        </p>
        <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-lg font-semibold text-neutral-400">
          <span>WhatsApp Commerce</span>
          <span>Cash on Delivery</span>
          <span>Easypaisa</span>
          <span>JazzCash</span>
          <span>Raast</span>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-medium tracking-tight sm:text-4xl">
          Everything you need to sell online
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Your online store", "A Shopify-style storefront with your own link. Mobile-first, Urdu-friendly, ready in minutes."],
            ["WhatsApp ordering", "Customers order from your store or chat on WhatsApp with one tap. No expensive API needed."],
            ["Orders dashboard", "Track every order from pending to delivered. Confirm, pack and ship from one clean panel."],
            ["Payments your way", "Cash on Delivery, bank transfer, Raast, Easypaisa and JazzCash — whatever your customers use."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-neutral-200 p-6">
              <h3 className="text-lg font-medium">{t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section id="how" className="bg-neutral-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-medium tracking-tight sm:text-4xl">
            Launch your store today
          </h2>
          <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
            {[
              ["1", "Sign up free", "Create your account in under a minute. No credit card required."],
              ["2", "Add products", "Upload photos, set prices in rupees, and write descriptions."],
              ["3", "Share & sell", "Share your store link on WhatsApp and Instagram. Orders roll in."],
            ].map(([n, t, d]) => (
              <div key={n} className="text-center">
                <p className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl font-medium">{n}</p>
                <h3 className="mt-4 text-lg font-medium">{t}</h3>
                <p className="mt-2 text-[15px] text-white/60">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/signup"
              className="inline-block rounded-xl bg-[#0d7a5f] px-10 py-4 text-base font-medium text-white transition hover:bg-[#0a644e]"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-medium tracking-tight sm:text-4xl">
          Simple pricing, in rupees
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-neutral-500">
          Start free. Upgrade when you grow. Every plan includes your store, orders and WhatsApp tools.
        </p>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {[
            ["Free", "Rs 0", "20 products", false],
            ["Business", "Rs 2,499/mo", "1,000 products + everything", true],
            ["Starter", "Rs 999/mo", "100 products", false],
          ].map(([name, price, feat, hot]) => (
            <div
              key={name as string}
              className={`rounded-2xl border p-8 ${hot ? "border-neutral-900 shadow-[0_16px_40px_rgba(0,0,0,0.10)]" : "border-neutral-200"}`}
            >
              {hot && (
                <span className="mb-3 inline-block rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-medium">{name}</h3>
              <p className="mt-2 text-3xl font-medium">{price}</p>
              <p className="mt-2 text-sm text-neutral-500">{feat}</p>
              <Link
                href="/signup"
                className={`mt-6 block rounded-xl py-3 text-center text-[15px] font-medium transition ${
                  hot ? "bg-neutral-900 text-white hover:bg-neutral-700" : "border border-neutral-300 hover:border-neutral-900"
                }`}
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section id="faq" className="border-t border-neutral-200 bg-neutral-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-medium tracking-tight">Frequently asked questions</h2>
          <div className="mt-10 space-y-4">
            {[
              ["Do I need technical skills?", "No. If you can use WhatsApp, you can run a Sellora store. Add products with photos and prices, share your link, done."],
              ["How do customers pay me?", "Cash on Delivery is built in, plus bank transfer, Raast, Easypaisa and JazzCash — you choose what to accept."],
              ["Is there really a free trial?", "Yes — 14 days on the Business plan, no credit card required."],
              ["Can customers order on WhatsApp?", "Yes. Every product and your whole store has a one-tap WhatsApp order button, plus a floating chat button."],
            ].map(([q, a]) => (
              <details key={q as string} className="rounded-xl border border-neutral-200 bg-white px-6 py-4">
                <summary className="cursor-pointer text-[15px] font-medium">{q}</summary>
                <p className="mt-2 text-[15px] text-neutral-500">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <h2 className="mx-auto max-w-2xl text-3xl font-medium tracking-tight sm:text-5xl">
          Start selling online today
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-500">
          Join Pakistan&apos;s WhatsApp and Instagram sellers running real online stores with Sellora.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-xl bg-[#0d7a5f] px-10 py-4 text-base font-medium text-white transition hover:bg-[#0a644e]"
        >
          Start free trial
        </Link>
        <p className="mt-3 text-[13px] text-neutral-500">14 days free · No credit card required</p>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-4 sm:px-6">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-neutral-500">
              The commerce platform for Pakistan&apos;s social sellers. Sell Simply. Grow Everywhere.
            </p>
          </div>
          {[
            ["Product", ["Features", "Pricing", "Demo store"]],
            ["Sell", ["WhatsApp commerce", "Instagram selling", "Cash on Delivery"]],
            ["Company", ["About", "Contact", "Privacy"]],
          ].map(([h, items]) => (
            <div key={h as string}>
              <p className="text-sm font-semibold uppercase tracking-wider">{h}</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-500">
                {(items as string[]).map((i) => (
                  <li key={i}><span className="cursor-pointer hover:text-neutral-900">{i}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-neutral-200">
          <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-neutral-400 sm:px-6">
            © {new Date().getFullYear()} Sellora. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
