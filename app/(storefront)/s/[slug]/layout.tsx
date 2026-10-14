import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CartProvider } from "@/features/storefront/cart-context";
import { StoreHeader } from "@/features/storefront/store-header";
import { WhatsAppFloat, InstagramIcon } from "@/features/storefront/social-buttons";

/** Storefront shell: brand header, cart state, social links, footer. */
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
  const brand = s.brand_color || "#065F46";

  const { data: settings } = await supabase
    .from("store_settings")
    .select("whatsapp_number, instagram_handle")
    .eq("store_id", s.id)
    .maybeSingle();
  const st = (settings ?? {}) as { whatsapp_number?: string | null; instagram_handle?: string | null };
  const ig = (st.instagram_handle ?? "").replace(/^@/, "").trim();

  return (
    <CartProvider slug={slug}>
      <div className="flex min-h-screen flex-col bg-canvas">
        <StoreHeader slug={slug} name={s.name} brandColor={brand} />
        <main className="flex-1">{children}</main>
        {st.whatsapp_number && <WhatsAppFloat phone={st.whatsapp_number} storeName={s.name} />}
        <footer className="border-t border-slate-200 bg-white px-6 py-8">
          <div className="mx-auto max-w-6xl text-center">
            <p className="font-bold text-ink">{s.name}</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              {st.whatsapp_number && (
                <a
                  href={`https://wa.me/${st.whatsapp_number.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/15 text-[#1da851] transition hover:bg-[#25D366]/25"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                </a>
              )}
              {ig && (
                <a
                  href={`https://instagram.com/${ig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500/10 text-pink-600 transition hover:bg-pink-500/20"
                >
                  <InstagramIcon size={18} />
                </a>
              )}
            </div>
            {ig && <p className="mt-2 text-xs text-muted">@{ig}</p>}
            <p className="mt-3 text-xs text-muted">
              Powered by <span className="font-semibold text-emerald-950">Sellora</span> — Sell Simply. Grow Everywhere.
            </p>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
