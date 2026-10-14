# Sellora — Phase 0

Scaffold for the Sellora SaaS platform (Next.js 15 + Supabase + Vercel).
See `../PLAN.md` for the phased build plan and `../DECISIONS.md` for the
10 foundation decisions.

## What exists right now (Phase 0)

- `app/` — Next.js App Router scaffold: brand palette (Tailwind), root
  layout, placeholder landing page, **subdomain middleware**
  (`<slug>.sellora.com` → `/s/<slug>`, Decision D3).
- `lib/supabase/` — three clients with a hard rule:
  - `client.ts` — browser, anon key only
  - `server.ts` — server components/actions, anon key + cookies
  - `admin.ts` — **service-role, server-only** (order tracking lookup,
    cron jobs, admin panel). Never import in a client component.
- `types/` — shared types (order statuses per D6, payment methods, plans).
- Folder structure per PRD §65: `components/`, `features/`,
  `lib/services/`, `hooks/`, `utils/`, `validators/`,
  `app/(marketing)`, `app/(dashboard)`, `app/(storefront)/s/[slug]`.
- `supabase/migrations/0001_core_schema.sql` — the full core schema:
  18 tables, `store_id` tenancy everywhere, RLS on everything, seed data
  for the 4 subscription plans (Free / Starter Rs 999 / Business Rs 2,499 /
  Pro Rs 4,999).

## Setup (needs the owner's accounts — ~20 minutes)

### 1. Supabase project
1. Create an account at supabase.com → **New project**.
2. In the SQL editor, paste and run
   `supabase/migrations/0001_core_schema.sql` (all of it, in order).
3. Storage → create two **private** buckets: `product-images`, `store-assets`.
   (Public-read policies for product images land in Phase 1 M1.3; the RLS
   SQL policies already allow public reads of live products.)
4. Project Settings → API → copy the **Project URL**, **anon key**, and
   **service_role key**.

### 2. Local run
```bash
cd app
cp .env.example .env.local   # then fill in the three Supabase values
npm install
npm run dev
```
- Marketing site: http://localhost:3000
- Test a storefront: http://demo.lvh.me:3000 (lvh.me resolves to 127.0.0.1;
  set `NEXT_PUBLIC_ROOT_DOMAIN=lvh.me` in `.env.local`)

### 3. Deploy to Vercel (Phase 1)
1. Push this folder to GitHub, import into Vercel.
2. Add the three Supabase env vars + `NEXT_PUBLIC_ROOT_DOMAIN=sellora.com`.
3. Domains → add `sellora.com`, `*.sellora.com`, `app.sellora.com`,
   `admin.sellora.com` (wildcard needs Vercel Pro).

## Quality gates (run before every phase handoff)

```bash
npm run typecheck   # tsc --noEmit
npm run build       # production build must be green
```

## What's next — Phase 1 (M1.1 → M1.6)

Auth + onboarding + products + storefront + dashboard + manual billing v1.
Details in `../PLAN.md`.
