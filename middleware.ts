import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain routing (Decision D3).
 *
 *  <slug>.sellora.com        -> rewrite to /s/<slug>   (storefront)
 *  app.sellora.com           -> the seller dashboard   (Phase 1)
 *  admin.sellora.com         -> the admin panel        (Phase 1 M1.6)
 *  sellora.com / www         -> marketing site (this app's root pages)
 *
 * Local dev: use lvh.me (resolves to 127.0.0.1), e.g. demo.lvh.me:3000
 * with NEXT_PUBLIC_ROOT_DOMAIN=lvh.me
 */
export function middleware(req: NextRequest) {
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "sellora.com";
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();

  // Not our domain (e.g. vercel preview deploys) — leave alone.
  if (!host.endsWith(rootDomain)) return NextResponse.next();

  const sub = host.slice(0, host.length - rootDomain.length).replace(/\.$/, "");

  if (!sub || sub === "www") return NextResponse.next(); // marketing site
  if (sub === "app" || sub === "admin") return NextResponse.next(); // handled by route groups in Phase 1

  // Storefront: <slug>.sellora.com -> /s/<slug>
  const url = req.nextUrl.clone();
  url.pathname = `/s/${sub}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
