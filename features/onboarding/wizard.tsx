"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  checkSlugAvailability,
  completeOnboarding,
} from "./actions";
import {
  CATEGORIES,
  BRAND_COLORS,
  slugify,
  type OnboardingInput,
} from "./schemas";

interface WizardProps {
  initialBusinessName: string;
  initialWhatsapp: string;
}

const STEPS = ["Business", "Store", "Product", "Payments", "Launch"] as const;

const initialData: OnboardingInput = {
  businessName: "",
  category: "",
  whatsapp: "",
  instagram: "",
  storeName: "",
  slug: "",
  brandColor: BRAND_COLORS[0],
  productName: "",
  productPrice: 0 as unknown as number,
  productStock: 0 as unknown as number,
  codEnabled: true,
  bankEnabled: false,
  bankDetails: "",
  raastEnabled: false,
  raastId: "",
  easypaisaEnabled: false,
  easypaisaDetails: "",
  jazzcashEnabled: false,
  jazzcashDetails: "",
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left"
    >
      <span className="text-sm font-medium text-ink">{label}</span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-emerald-950" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function OnboardingWizard({ initialBusinessName, initialWhatsapp }: WizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingInput>({
    ...initialData,
    businessName: initialBusinessName,
    storeName: initialBusinessName,
    slug: slugify(initialBusinessName),
    whatsapp: initialWhatsapp,
  });
  const [error, setError] = useState<string | null>(null);
  const [slugState, setSlugState] = useState<{ available: boolean; message: string } | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchedSlug, setLaunchedSlug] = useState<string | null>(null);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof OnboardingInput>(key: K, value: OnboardingInput[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setError(null);
  };

  // Debounced live slug check on Step 2
  useEffect(() => {
    if (step !== 1) return;
    const slug = data.slug.trim().toLowerCase();
    if (!slug) {
      setSlugState(null);
      return;
    }
    setCheckingSlug(true);
    if (slugTimer.current) clearTimeout(slugTimer.current);
    slugTimer.current = setTimeout(async () => {
      const res = await checkSlugAvailability(slug);
      setSlugState(res);
      setCheckingSlug(false);
    }, 500);
    return () => {
      if (slugTimer.current) clearTimeout(slugTimer.current);
    };
  }, [data.slug, step]);

  function validateStep(): string | null {
    if (step === 0) {
      if (data.businessName.trim().length < 2) return "Business name is required.";
      if (!data.category) return "Choose a business category.";
      if (!/^0?3\d{9}$/.test(data.whatsapp.trim()))
        return "Enter a valid WhatsApp number (03XX-XXXXXXX).";
    }
    if (step === 1) {
      if (data.storeName.trim().length < 2) return "Store name is required.";
      if (!slugState?.available) return "Pick an available store URL first.";
    }
    if (step === 2) {
      if (data.productName.trim().length < 2) return "Product name is required.";
      if (!Number.isInteger(data.productPrice) || data.productPrice <= 0)
        return "Enter a valid price in rupees.";
      if (!Number.isInteger(data.productStock) || data.productStock < 0)
        return "Enter a valid stock quantity.";
    }
    if (step === 3) {
      if (data.bankEnabled && !data.bankDetails.trim()) return "Add your bank transfer details.";
      if (data.raastEnabled && !data.raastId.trim()) return "Add your Raast ID.";
      if (data.easypaisaEnabled && !data.easypaisaDetails.trim())
        return "Add your Easypaisa details.";
      if (data.jazzcashEnabled && !data.jazzcashDetails.trim()) return "Add your JazzCash details.";
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function launch() {
    setLaunching(true);
    setError(null);
    const res = await completeOnboarding(data);
    setLaunching(false);
    if (res.ok) {
      setLaunchedSlug(res.slug);
    } else {
      setError(res.error);
    }
  }

  // ---- Success screen ----
  if (launchedSlug) {
    const storeUrl = `https://${launchedSlug}.sellora.com`;
    const waText = encodeURIComponent(
      `My online store is live! Shop here: ${storeUrl}`
    );
    return (
      <Card className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-mint">
          <span className="text-2xl font-bold text-emerald-950">✓</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-ink">Your store is ready!</h1>
        <p className="mt-2 text-sm text-muted">
          Share the link below with your customers on WhatsApp and Instagram.
        </p>
        <p className="mt-4 break-all rounded-xl bg-canvas px-4 py-3 font-mono text-sm text-emerald-950">
          {storeUrl}
        </p>
        <div className="mt-6 space-y-3">
          <Button
            variant="secondary"
            onClick={() => {
              navigator.clipboard.writeText(storeUrl);
            }}
          >
            Copy store link
          </Button>
          <a
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#25D366] px-6 text-[15px] font-semibold text-white transition-all hover:brightness-95"
          >
            Share on WhatsApp
          </a>
          <a
            href={`/s/${launchedSlug}`}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-emerald-950 px-6 text-[15px] font-semibold text-white transition-all hover:bg-emerald-950/90"
          >
            Preview my store
          </a>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    i < step
                      ? "bg-emerald-950 text-white"
                      : i === step
                        ? "bg-brand-mint text-emerald-950 ring-2 ring-brand-light"
                        : "bg-slate-100 text-muted"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span className="mt-1 hidden text-[11px] font-medium text-muted sm:block">
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 rounded ${i < step ? "bg-emerald-950" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Step 1 — Business info */}
      {step === 0 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-ink">Tell us about your business</h1>
          <Input
            label="Business name"
            value={data.businessName}
            onChange={(e) => set("businessName", e.target.value)}
            placeholder="e.g. Ayesha's Boutique"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
            <select
              value={data.category}
              onChange={(e) => set("category", e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-ink focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/30"
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="WhatsApp number"
            value={data.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="03XX-XXXXXXX"
            hint="Customers will contact you on this number."
          />
          <Input
            label="Instagram handle (optional)"
            value={data.instagram}
            onChange={(e) => set("instagram", e.target.value.replace(/^@/, ""))}
            placeholder="yourshop.pk"
            hint="Shown on your store so customers can follow you."
          />
        </div>
      )}

      {/* Step 2 — Store identity */}
      {step === 1 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-ink">Name your store</h1>
          <Input
            label="Store name"
            value={data.storeName}
            onChange={(e) => {
              set("storeName", e.target.value);
              if (!data.slug || slugify(data.storeName) === data.slug) {
                set("slug", slugify(e.target.value));
              }
            }}
            placeholder="e.g. Ayesha's Boutique"
          />
          <div>
            <Input
              label="Store URL"
              value={data.slug}
              onChange={(e) => set("slug", slugify(e.target.value))}
              placeholder="your-store-name"
            />
            <p className="mt-1.5 text-xs text-muted">
              Your store will live at{" "}
              <span className="font-mono text-ink">{data.slug || "your-store"}.sellora.com</span>
            </p>
            {checkingSlug && <p className="mt-1.5 text-xs text-muted">Checking availability…</p>}
            {slugState && !checkingSlug && (
              <p className={`mt-1.5 text-xs font-medium ${slugState.available ? "text-emerald-700" : "text-red-600"}`}>
                {slugState.message}
              </p>
            )}
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink">Brand color</span>
            <div className="flex gap-3">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("brandColor", c)}
                  aria-label={`Brand color ${c}`}
                  className={`h-10 w-10 rounded-full transition-all ${
                    data.brandColor === c ? "ring-2 ring-offset-2 ring-ink" : "ring-1 ring-slate-200"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — First product */}
      {step === 2 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-ink">Add your first product</h1>
          <p className="-mt-2 text-sm text-muted">You can add more from your dashboard later.</p>
          <Input
            label="Product name"
            value={data.productName}
            onChange={(e) => set("productName", e.target.value)}
            placeholder="e.g. Premium Lawn Suit"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (Rs)"
              type="number"
              min={1}
              value={data.productPrice || ""}
              onChange={(e) => set("productPrice", parseInt(e.target.value, 10) || (0 as unknown as number))}
              placeholder="2500"
            />
            <Input
              label="Stock"
              type="number"
              min={0}
              value={data.productStock === 0 ? "0" : data.productStock || ""}
              onChange={(e) => set("productStock", parseInt(e.target.value, 10) || 0)}
              placeholder="50"
            />
          </div>
        </div>
      )}

      {/* Step 4 — Payments */}
      {step === 3 && (
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-ink">How do you take payments?</h1>
          <p className="-mt-1 text-sm text-muted">Customers will see these options at checkout.</p>
          <Toggle checked={data.codEnabled} onChange={(v) => set("codEnabled", v)} label="Cash on Delivery" />
          <Toggle checked={data.bankEnabled} onChange={(v) => set("bankEnabled", v)} label="Bank transfer" />
          {data.bankEnabled && (
            <Input
              label="Bank details"
              value={data.bankDetails}
              onChange={(e) => set("bankDetails", e.target.value)}
              placeholder="Bank name, account title, IBAN…"
            />
          )}
          <Toggle checked={data.raastEnabled} onChange={(v) => set("raastEnabled", v)} label="Raast" />
          {data.raastEnabled && (
            <Input
              label="Raast ID"
              value={data.raastId}
              onChange={(e) => set("raastId", e.target.value)}
              placeholder="e.g. 03001234567"
            />
          )}
          <Toggle checked={data.easypaisaEnabled} onChange={(v) => set("easypaisaEnabled", v)} label="Easypaisa" />
          {data.easypaisaEnabled && (
            <Input
              label="Easypaisa details"
              value={data.easypaisaDetails}
              onChange={(e) => set("easypaisaDetails", e.target.value)}
              placeholder="Account number / instructions…"
            />
          )}
          <Toggle checked={data.jazzcashEnabled} onChange={(v) => set("jazzcashEnabled", v)} label="JazzCash" />
          {data.jazzcashEnabled && (
            <Input
              label="JazzCash details"
              value={data.jazzcashDetails}
              onChange={(e) => set("jazzcashDetails", e.target.value)}
              placeholder="Account number / instructions…"
            />
          )}
        </div>
      )}

      {/* Step 5 — Review & launch */}
      {step === 4 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-ink">Ready to launch?</h1>
          <dl className="space-y-2 rounded-2xl bg-canvas p-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Business</dt><dd className="font-medium text-ink">{data.businessName}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Store</dt><dd className="font-medium text-ink">{data.storeName}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">URL</dt><dd className="font-mono font-medium text-ink">{data.slug}.sellora.com</dd></div>
            <div className="flex justify-between"><dt className="text-muted">First product</dt><dd className="font-medium text-ink">{data.productName} — Rs {data.productPrice.toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Trial</dt><dd className="font-medium text-emerald-700">14-day Business plan</dd></div>
          </dl>
          <Button size="lg" loading={launching} onClick={launch}>
            Launch my store
          </Button>
        </div>
      )}

      {/* Nav */}
      {step < 4 && (
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button variant="secondary" onClick={() => { setError(null); setStep((s) => s - 1); }}>
              Back
            </Button>
          )}
          <Button onClick={next}>Continue</Button>
        </div>
      )}
      {step === 4 && !launchedSlug && (
        <div className="mt-4">
          <Button variant="ghost" onClick={() => { setError(null); setStep(3); }}>
            ← Back to payments
          </Button>
        </div>
      )}
    </Card>
  );
}
