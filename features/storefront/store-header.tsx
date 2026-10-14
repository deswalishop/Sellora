"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./cart-context";

/** Storefront header: brand color, search, cart (PRD section 24). */
export function StoreHeader({
  slug,
  name,
  brandColor,
}: {
  slug: string;
  name: string;
  brandColor: string;
}) {
  const { count } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-20 text-white shadow-md" style={{ backgroundColor: brandColor }}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href={`/s/${slug}`} className="truncate text-lg font-bold tracking-tight">
          {name}
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-white/90 sm:flex">
          <Link href={`/s/${slug}`} className="hover:text-white">Home</Link>
          <Link href={`/s/${slug}/products`} className="hover:text-white">Products</Link>
          <Link href={`/s/${slug}/track`} className="hover:text-white">Track Order</Link>
        </nav>
        <form
          className="ml-auto hidden min-w-0 flex-1 max-w-xs sm:block"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/s/${slug}/products?q=${encodeURIComponent(q)}`);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="h-9 w-full rounded-full bg-white/15 px-4 text-sm text-white placeholder:text-white/60 focus:bg-white/25 focus:outline-none"
          />
        </form>
        <Link
          href={`/s/${slug}/cart`}
          aria-label="Cart"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold" style={{ color: brandColor }}>
              {count}
            </span>
          )}
        </Link>
      </div>
      {/* Mobile search */}
      <div className="px-4 pb-3 sm:hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/s/${slug}/products?q=${encodeURIComponent(q)}`);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="h-9 w-full rounded-full bg-white/15 px-4 text-sm text-white placeholder:text-white/60 focus:bg-white/25 focus:outline-none"
          />
        </form>
      </div>
    </header>
  );
}
