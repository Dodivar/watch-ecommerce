-- Lien de suivi durable de commande (email de confirmation).
-- Voir supabase/migrations/README.md — « Lien de suivi de commande ».

alter table public.orders
  add column if not exists followup_token_hash text;
