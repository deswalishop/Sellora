-- 0006_social_handles.sql
-- Instagram handle for storefront social links (PRD: Instagram commerce).
-- whatsapp_number already exists on store_settings (M1.2).

alter table public.store_settings
  add column if not exists instagram_handle text;

comment on column public.store_settings.instagram_handle is
  'Instagram username without @, e.g. ayeshas.boutique';
