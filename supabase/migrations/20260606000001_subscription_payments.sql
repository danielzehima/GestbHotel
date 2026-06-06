-- ============================================================================
-- Paiements d'abonnement SaaS via GeniusPay (pay.genius.ci)
-- Trace chaque tentative de paiement de forfait. L'activation du forfait se fait
-- UNIQUEMENT via le webhook signé (source de vérité), jamais via la redirection.
-- ============================================================================

create table if not exists subscription_payments (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  plan text not null check (plan in ('basique', 'standard', 'premium')),
  months int not null default 1 check (months >= 1),
  amount numeric(12, 2) not null,
  currency text not null default 'XOF',
  provider text not null default 'geniuspay',
  -- Référence renvoyée par GeniusPay (format MTX-XXXXXXXXXX)
  reference text unique,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'expired')),
  checkout_url text,
  environment text,            -- 'sandbox' | 'live'
  -- Empêche une double-activation si le webhook est rejoué
  applied boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_subscription_payments_hotel on subscription_payments(hotel_id);
create index if not exists idx_subscription_payments_reference on subscription_payments(reference);
create index if not exists idx_subscription_payments_status on subscription_payments(status);

-- Trigger updated_at (fonction set_updated_at() déjà définie dans la migration initiale)
drop trigger if exists trg_subscription_payments_updated_at on subscription_payments;
create trigger trg_subscription_payments_updated_at before update on subscription_payments
  for each row execute function set_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================
alter table subscription_payments enable row level security;

-- Lecture : l'admin voit l'historique des paiements de SON hôtel
drop policy if exists "subscription_payments read own hotel" on subscription_payments;
create policy "subscription_payments read own hotel"
  on subscription_payments for select
  using (hotel_id = current_hotel_id());

-- Insertion : seul l'admin de l'hôtel peut initier un paiement pour son hôtel
drop policy if exists "subscription_payments insert admin" on subscription_payments;
create policy "subscription_payments insert admin"
  on subscription_payments for insert
  with check (
    hotel_id = current_hotel_id()
    and current_user_role() in ('admin', 'super_admin')
  );

-- Aucune policy UPDATE/DELETE : les mises à jour de statut et l'activation
-- du forfait passent exclusivement par le webhook (client service_role, bypass RLS).
