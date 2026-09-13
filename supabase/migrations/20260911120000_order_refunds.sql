-- Remboursements pilotés depuis l'admin — table de détail + verrouillage du cache
--
-- Trois changements indissociables :
--
-- 1. `order_refunds` : un remboursement Stripe = une ligne. Les colonnes
--    `orders.refund_amount_cents` / `refunded_at` / `stripe_refund_id` ne
--    tenaient pas au-delà d'UN remboursement ; elles deviennent un cache
--    dénormalisé recalculé par le backend à chaque événement Stripe.
-- 2. Motif et origine de la demande de rétractation : la page de suivi de
--    commande permet désormais au client de la déclencher lui-même, et la date
--    de notification (départ des 14 jours de l'art. L221-24) doit être posée
--    par le serveur, pas déclarée après coup par l'admin.
-- 3. Retrait du droit d'écriture du panel sur les colonnes de remboursement :
--    elles ne sont plus alimentées que par le webhook Stripe (service role).
--    Sans cela le bouton « Rembourser » serait cosmétique — le montant resterait
--    falsifiable depuis le navigateur.
--
-- Prérequis : 20260525120000_admin_phase1.sql (`is_admin_user()`),
--             20260824120000_order_returns.sql (colonnes retour de `orders`).

-- ------------------------------------------------------------------ 1. Détail

create table if not exists public.order_refunds (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  order_id uuid not null references public.orders (id) on delete cascade,
  stripe_refund_id text not null unique,
  stripe_payment_intent_id text,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'eur',
  -- Statuts Stripe d'un Refund. Un remboursement n'est PAS final à la création :
  -- il peut rester `pending` puis basculer `failed` (solde insuffisant, réseau
  -- carte). Seul `succeeded` compte dans les totaux.
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'canceled', 'requires_action')),
  reason text,
  failure_reason text,
  -- D'où vient le remboursement : bouton du panel, dashboard Stripe (panne,
  -- habitude), ou litige tranché en faveur de l'acheteur. La colonne existe
  -- pour que « remboursé sans passer par nous » reste visible, pas pour filtrer.
  source text not null default 'unknown'
    check (source in ('admin_panel', 'stripe_dashboard', 'dispute', 'unknown')),
  initiated_by text,
  metadata jsonb not null default '{}'::jsonb,
  refunded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_refunds_order_idx
  on public.order_refunds (order_id, refunded_at desc);

create index if not exists order_refunds_site_idx
  on public.order_refunds (site_id, refunded_at desc);

alter table public.order_refunds enable row level security;

-- Lecture par le panel (le détail s'affiche sous le bouton « Rembourser »).
-- Aucune policy d'écriture : les lignes ne sont écrites que par le backend en
-- service role, qui contourne la RLS.
drop policy if exists "order_refunds_admin_read" on public.order_refunds;
create policy "order_refunds_admin_read"
  on public.order_refunds for select
  using (public.is_admin_user());

-- ------------------------------------- 2. Demande de rétractation côté client

alter table public.orders
  add column if not exists return_reason text,
  add column if not exists return_requested_by text;

alter table public.orders
  drop constraint if exists orders_return_requested_by_check;

alter table public.orders
  add constraint orders_return_requested_by_check
  check (return_requested_by is null or return_requested_by in ('customer', 'admin'));

-- ------------------------------------------------- 3. Cache en lecture seule

-- Le panel n'écrit plus que le suivi logistique du dossier. Les montants
-- viennent de `order_refunds`, recalculés par le backend.
--
-- Rollback : `grant update on public.orders to authenticated;` rétablit
-- l'écriture sur toutes les colonnes.
revoke update on public.orders from authenticated;

grant update (
  fulfillment_status,
  delivered_at,
  return_status,
  return_requested_at,
  return_reason,
  return_requested_by,
  return_notes,
  updated_at
) on public.orders to authenticated;
