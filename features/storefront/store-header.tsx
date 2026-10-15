"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./cart-context";

/**
 * Dawn-style storefront header: announcement bar, sticky white header with
 * nav left, store name, and search + cart icons right.
 */
export function StoreHeader({
  slug,
  name,
  brandColor,
  announcement,
}: {
  slug: string;
  name: string;
  brandColor: string;
  announcement?: string | null;
}) {
  const { count, setDrawerOpen } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const goSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    router.push(`/s/${slug}/products?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      {announcement && (
        <div
          className="px-4 py-2 text-center text-[13px] font-medium tracking-wide text-white"
          style={{ backgroundColor: brandColor }}
        >
          {announcement}
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-6 sm:px-6">
          {/* Mobile menu button */}
          <button
            className="rounded p-2 hover:bg-neutral-100 sm:hidden"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-[15px] text-neutral-800 sm:flex">
            <Link href={`/s/${slug}`} className="hover:underline underline-offset-4">Home</Link>
            <Link href={`/s/${slug}/products`} className="hover:underline underline-offset-4">Catalog</Link>
            <Link href={`/s/${slug}/track`} className="hover:underline underline-offset-4">Track order</Link>
          </nav>

          {/* Store name */}
          <Link
            href={`/s/${slug}`}
            className="mx-auto truncate text-xl font-semibold tracking-tight text-neutral-900 sm:mx-0"
          >
            {name}
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <button
              className="rounded-full p-2.5 text-neutral-800 hover:bg-neutral-100"
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </button>
            <button
              className="relative rounded-full p-2.5 text-neutral-800 hover:bg-neutral-100"
              aria-label={`Cart, ${count} items`}
              onClick={() => setDrawerOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h15l-1.5 9h-12z" /><path d="M6 7 5 3H2" /><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></svg>
              {count > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expanding search */}
        {searchOpen && (
          <div className="border-t border-neutral-200 px-4 py-3">
            <form onSubmit={goSearch} className="mx-auto flex max-w-7xl gap-2">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className="h-11 flex-1 rounded border border-neutral-300 px-4 text-[15px] focus:border-neutral-900 focus:outline-none"
              />
              <button
                type="submit"
                className="h-11 rounded px-6 text-[15px] font-medium text-white"
                style={{ backgroundColor: brandColor }}
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="border-t border-neutral-200 px-4 py-2 sm:hidden">
            {[
              ["Home", `/s/${slug}`],
              ["Catalog", `/s/${slug}/products`],
              ["Track order", `/s/${slug}/track`],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block border-b border-neutral-100 py-3 text-[15px] text-neutral-800 last:border-0"
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
