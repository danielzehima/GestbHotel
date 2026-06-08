-- ============================================================================
-- APPELS SERVEUR (client scanne le QR de sa table et appelle un serveur)
-- ============================================================================

create table service_calls (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  table_id uuid references restaurant_tables(id) on delete set null,
  message text,
  statut text not null default 'en_attente', -- 'en_attente' | 'traite'
  created_at timestamptz default now(),
  handled_at timestamptz,
  handled_by uuid references profiles(id) on delete set null
);

create index idx_service_calls_hotel on service_calls(hotel_id);
create index idx_service_calls_statut on service_calls(statut);

alter table service_calls enable row level security;

-- Lecture : membres de l'hôtel. Insertion : faite via la service role (client public).
create policy "service_calls select" on service_calls for select
  using (hotel_id = current_hotel_id());

create policy "service_calls update" on service_calls for update
  using (hotel_id = current_hotel_id()
         and current_user_role() in ('admin','serveur','cuisine','receptionniste'))
  with check (hotel_id = current_hotel_id());
