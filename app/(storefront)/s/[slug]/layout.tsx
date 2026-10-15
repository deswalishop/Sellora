import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CartProvider } from "@/features/storefront/cart-context";
import { StoreHeader } from "@/features/storefront/store-header";
import { CartDrawer } from "@/features/storefront/cart-drawer";
import { WhatsAppFloat, InstagramIcon } from "@/features/storefront/social-buttons";

/** Dawn-style storefront shell: announcement bar, header, cart drawer, footer. */
export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, brand_color")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!store) notFound();
  const s = store as { id: string; name: string; brand_color: string };
  const brand = s.brand_color || "#121212";

  const { data: settings } = await supabase
    .from("store_settings")
    .select("whatsapp_number, instagram_handle, announcement_bar")
    .eq("store_id", s.id)
    .maybeSingle();
  const st = (settings ?? {}) as {
    whatsapp_number?: string | null;
    instagram_handle?: string | null;
    announcement_bar?: string | null;
  };
  const ig = (st.instagram_handle ?? "").replace(/^@/, "").trim();

  return (
    <CartProvider slug={slug}>
      <div className="flex min-h-screen flex-col bg-white text-neutral-900 antialiased">
        <StoreHeader slug={slug} name={s.name} brandColor={brand} announcement={st.announcement_bar} />
        <main className="flex-1">{children}</main>
        {st.whatsapp_number && <WhatsAppFloat phone={st.whatsapp_number} storeName={s.name} />}
        <CartDrawer slug={slug} brandColor={brand} />

        {/* Dawn-style footer */}
        <footer className="mt-16 border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-3 sm:px-6">
            <div>
              <p className="text-lg font-semibold">{s.name}</p>
              <p className="mt-2 max-w-xs text-sm text-neutral-500">
                Quality products delivered across Pakistan. Cash on delivery available.
              </p>
              <div className="mt-4 flex items-center gap-2">
                {st.whatsapp_number && (
                  <a
                    href={`https://wa.me/${st.whatsapp_number.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition hover:border-neutral-900"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                  </a>
                )}
                {ig && (
                  <a
                    href={`https://instagram.com/${ig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition hover:border-neutral-900"
                  >
                    <InstagramIcon size={17} />
                  </a>
                )}
              </div>
              {ig && <p className="mt-2 text-sm text-neutral-500">@{ig}</p>}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-neutral-900">Shop</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li><Link href={`/s/${slug}`} className="hover:text-neutral-900 hover:underline underline-offset-4">Home</Link></li>
                <li><Link href={`/s/${slug}/products`} className="hover:text-neutral-900 hover:underline underline-offset-4">All products</Link></li>
                <li><Link href={`/s/${slug}/track`} className="hover:text-neutral-900 hover:underline underline-offset-4">Track your order</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-neutral-900">Help</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li>Cash on delivery available nationwide</li>
                <li>7-day easy exchange</li>
                {st.whatsapp_number && (
                  <li>
                    <a
                      href={`https://wa.me/${st.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(`Assalam-o-Alaikum! I have a question about ${s.name}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-neutral-900 hover:underline underline-offset-4"
                    >
                      Chat on WhatsApp
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-200">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-neutral-500 sm:flex-row sm:px-6">
              <p>© {new Date().getFullYear()} {s.name}. All rights reserved.</p>
              <p>
                Powered by <span className="font-semibold text-neutral-800">Sellora</span>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
