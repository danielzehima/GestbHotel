-- ============================================================================
-- GESTION_HOTEL — Schéma initial multi-tenant
-- Modules : Tenants, Users/Rôles, Chambres, Réservations, RH, Restaurant,
--           Facturation, Paiements
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

create type user_role as enum (
  'super_admin',     -- gestion plateforme SaaS
  'admin',           -- propriétaire / directeur de l'hôtel
  'receptionniste',
  'menage',
  'serveur',
  'cuisine',
  'comptable'
);

create type room_status as enum (
  'disponible',
  'occupee',
  'nettoyage',
  'maintenance',
  'hors_service'
);

create type room_type as enum (
  'simple',
  'double',
  'twin',
  'suite',
  'familiale',
  'deluxe'
);

create type reservation_status as enum (
  'en_attente',
  'confirmee',
  'check_in',
  'check_out',
  'annulee',
  'no_show'
);

create type housekeeping_status as enum (
  'a_faire',
  'en_cours',
  'terminee',
  'verifiee'
);

create type shift_type as enum (
  'matin',
  'apres_midi',
  'nuit',
  'journee'
);

create type order_type as enum (
  'sur_place',
  'room_service',
  'a_emporter'
);

create type order_status as enum (
  'nouvelle',
  'en_preparation',
  'prete',
  'servie',
  'annulee'
);

create type menu_category as enum (
  'entree',
  'plat',
  'dessert',
  'boisson',
  'petit_dejeuner',
  'menu_enfant',
  'special'
);

create type invoice_status as enum (
  'brouillon',
  'emise',
  'partiellement_payee',
  'payee',
  'annulee'
);

create type payment_method as enum (
  'especes',
  'carte',
  'wave',
  'orange_money',
  'mtn_money',
  'cinetpay',
  'virement'
);

create type payment_status as enum (
  'en_attente',
  'reussi',
  'echoue',
  'rembourse'
);

-- ============================================================================
-- 2. MULTI-TENANT — Hôtels (tenants)
-- ============================================================================

create table hotels (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  slug text unique not null,
  adresse text,
  ville text,
  pays text default 'CI',
  telephone text,
  email text,
  devise text default 'XOF',
  logo_url text,
  parametres jsonb default '{}'::jsonb,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_hotels_slug on hotels(slug);

-- ============================================================================
-- 3. UTILISATEURS — liés à auth.users de Supabase
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  hotel_id uuid references hotels(id) on delete cascade,
  nom text not null,
  prenom text not null,
  telephone text,
  role user_role not null default 'receptionniste',
  avatar_url text,
  actif boolean default true,
  derniere_connexion timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_profiles_hotel on profiles(hotel_id);
create index idx_profiles_role on profiles(role);

-- ============================================================================
-- 4. CHAMBRES
-- ============================================================================

create table room_types (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  code text not null,
  libelle text not null,
  type room_type not null,
  capacite_adultes int default 2,
  capacite_enfants int default 0,
  prix_nuit numeric(12,2) not null,
  description text,
  equipements jsonb default '[]'::jsonb,
  photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  unique(hotel_id, code)
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  room_type_id uuid references room_types(id) on delete set null,
  numero text not null,
  etage int,
  statut room_status not null default 'disponible',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(hotel_id, numero)
);

create index idx_rooms_hotel on rooms(hotel_id);
create index idx_rooms_statut on rooms(statut);

-- ============================================================================
-- 5. CLIENTS & RÉSERVATIONS
-- ============================================================================

create table guests (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  nom text not null,
  prenom text not null,
  email text,
  telephone text,
  nationalite text,
  type_piece text,
  numero_piece text,
  date_naissance date,
  adresse text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_guests_hotel on guests(hotel_id);
create index idx_guests_email on guests(email);
create index idx_guests_telephone on guests(telephone);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  reference text not null,
  guest_id uuid not null references guests(id) on delete restrict,
  room_id uuid references rooms(id) on delete set null,
  room_type_id uuid references room_types(id) on delete set null,
  date_arrivee date not null,
  date_depart date not null,
  nb_adultes int default 1,
  nb_enfants int default 0,
  statut reservation_status not null default 'en_attente',
  prix_total numeric(12,2) not null default 0,
  acompte numeric(12,2) default 0,
  source text,
  notes text,
  check_in_at timestamptz,
  check_out_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(hotel_id, reference),
  check (date_depart > date_arrivee)
);

create index idx_reservations_hotel on reservations(hotel_id);
create index idx_reservations_dates on reservations(date_arrivee, date_depart);
create index idx_reservations_statut on reservations(statut);
create index idx_reservations_room on reservations(room_id);

-- ============================================================================
-- 6. RH — Plannings & Tâches
-- ============================================================================

create table shifts (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  type shift_type not null,
  heure_debut time not null,
  heure_fin time not null,
  notes text,
  created_at timestamptz default now()
);

create index idx_shifts_hotel_date on shifts(hotel_id, date);
create index idx_shifts_profile on shifts(profile_id);

create table housekeeping_tasks (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  assignee_id uuid references profiles(id) on delete set null,
  statut housekeeping_status not null default 'a_faire',
  priorite int default 1,
  description text,
  date_prevue date not null,
  debut_at timestamptz,
  fin_at timestamptz,
  verifie_par uuid references profiles(id) on delete set null,
  verifie_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_housekeeping_hotel on housekeeping_tasks(hotel_id);
create index idx_housekeeping_assignee on housekeeping_tasks(assignee_id);
create index idx_housekeeping_statut on housekeeping_tasks(statut);

create table time_clock (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  pointage_in timestamptz not null default now(),
  pointage_out timestamptz,
  notes text
);

create index idx_time_clock_profile on time_clock(profile_id);

-- ============================================================================
-- 7. RESTAURANT (F&B)
-- ============================================================================

create table menus (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  nom text not null,
  description text,
  actif boolean default true,
  created_at timestamptz default now()
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  menu_id uuid not null references menus(id) on delete cascade,
  nom text not null,
  description text,
  categorie menu_category not null,
  prix numeric(12,2) not null,
  photo_url text,
  allergenes jsonb default '[]'::jsonb,
  disponible boolean default true,
  temps_preparation_min int,
  ordre int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_menu_items_menu on menu_items(menu_id);
create index idx_menu_items_categorie on menu_items(categorie);

create table restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  numero text not null,
  capacite int default 2,
  qr_code text unique,
  zone text,
  active boolean default true,
  unique(hotel_id, numero)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  numero text not null,
  type order_type not null,
  statut order_status not null default 'nouvelle',
  table_id uuid references restaurant_tables(id) on delete set null,
  reservation_id uuid references reservations(id) on delete set null,
  room_id uuid references rooms(id) on delete set null,
  guest_id uuid references guests(id) on delete set null,
  serveur_id uuid references profiles(id) on delete set null,
  total numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(hotel_id, numero)
);

create index idx_orders_hotel on orders(hotel_id);
create index idx_orders_statut on orders(statut);
create index idx_orders_reservation on orders(reservation_id);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id) on delete restrict,
  quantite int not null default 1,
  prix_unitaire numeric(12,2) not null,
  total numeric(12,2) generated always as (quantite * prix_unitaire) stored,
  notes text,
  statut order_status default 'nouvelle'
);

create index idx_order_items_order on order_items(order_id);

-- ============================================================================
-- 8. FACTURATION & PAIEMENTS
-- ============================================================================

create table invoices (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  numero text not null,
  reservation_id uuid references reservations(id) on delete set null,
  guest_id uuid references guests(id) on delete set null,
  statut invoice_status not null default 'brouillon',
  sous_total numeric(12,2) not null default 0,
  taxe numeric(12,2) not null default 0,
  remise numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  montant_paye numeric(12,2) not null default 0,
  date_emission date default current_date,
  date_echeance date,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(hotel_id, numero)
);

create index idx_invoices_hotel on invoices(hotel_id);
create index idx_invoices_reservation on invoices(reservation_id);
create index idx_invoices_statut on invoices(statut);

create table invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  libelle text not null,
  reference_type text, -- 'reservation' | 'order' | 'service'
  reference_id uuid,
  quantite numeric(10,2) not null default 1,
  prix_unitaire numeric(12,2) not null,
  total numeric(12,2) generated always as (quantite * prix_unitaire) stored
);

create index idx_invoice_lines_invoice on invoice_lines(invoice_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete set null,
  reservation_id uuid references reservations(id) on delete set null,
  methode payment_method not null,
  statut payment_status not null default 'en_attente',
  montant numeric(12,2) not null,
  reference_transaction text,
  cinetpay_transaction_id text,
  metadata jsonb default '{}'::jsonb,
  encaisse_par uuid references profiles(id) on delete set null,
  encaisse_at timestamptz default now(),
  created_at timestamptz default now()
);

create index idx_payments_hotel on payments(hotel_id);
create index idx_payments_invoice on payments(invoice_id);
create index idx_payments_statut on payments(statut);

-- ============================================================================
-- 9. FONCTIONS UTILITAIRES
-- ============================================================================

-- Récupère hotel_id du user courant
create or replace function current_hotel_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hotel_id from profiles where id = auth.uid()
$$;

-- Récupère role du user courant
create or replace function current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

-- Trigger générique updated_at
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Appliquer à toutes les tables avec updated_at
do $$
declare
  t text;
begin
  for t in
    select table_name from information_schema.columns
    where column_name = 'updated_at' and table_schema = 'public'
  loop
    execute format(
      'create trigger trg_%I_updated_at before update on %I
       for each row execute function set_updated_at()',
      t, t
    );
  end loop;
end$$;

-- ============================================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================================

alter table hotels              enable row level security;
alter table profiles            enable row level security;
alter table room_types          enable row level security;
alter table rooms               enable row level security;
alter table guests              enable row level security;
alter table reservations        enable row level security;
alter table shifts              enable row level security;
alter table housekeeping_tasks  enable row level security;
alter table time_clock          enable row level security;
alter table menus               enable row level security;
alter table menu_items          enable row level security;
alter table restaurant_tables   enable row level security;
alter table orders              enable row level security;
alter table order_items         enable row level security;
alter table invoices            enable row level security;
alter table invoice_lines       enable row level security;
alter table payments            enable row level security;

-- ----- HOTELS -----
create policy "hotel visible aux membres"
  on hotels for select
  using (id = current_hotel_id() or current_user_role() = 'super_admin');

create policy "hotel modifiable par admin"
  on hotels for update
  using (id = current_hotel_id() and current_user_role() in ('admin','super_admin'));

-- ----- PROFILES -----
create policy "voir profils du meme hotel"
  on profiles for select
  using (hotel_id = current_hotel_id() or id = auth.uid());

create policy "admin gere les profils"
  on profiles for all
  using (hotel_id = current_hotel_id() and current_user_role() in ('admin','super_admin'))
  with check (hotel_id = current_hotel_id());

create policy "user modifie son profil"
  on profiles for update
  using (id = auth.uid());

-- ----- Macro RLS multi-tenant (lecture pour tous les membres de l'hotel) -----
-- Helper : on applique le pattern hotel_id = current_hotel_id()

-- ROOMS / ROOM_TYPES
create policy "rt select" on room_types for select using (hotel_id = current_hotel_id());
create policy "rt write" on room_types for all
  using (hotel_id = current_hotel_id() and current_user_role() in ('admin','receptionniste'))
  with check (hotel_id = current_hotel_id());

create policy "rooms select" on rooms for select using (hotel_id = current_hotel_id());
create policy "rooms admin write" on rooms for all
  using (hotel_id = current_hotel_id() and current_user_role() in ('admin','receptionniste'))
  with check (hotel_id = current_hotel_id());
create policy "rooms menage update statut"
  on rooms for update
  using (hotel_id = current_hotel_id() and current_user_role() = 'menage')
  with check (hotel_id = current_hotel_id());

-- GUESTS
create policy "guests select" on guests for select using (hotel_id = current_hotel_id());
create policy "guests write" on guests for all
  using (hotel_id = current_hotel_id() and current_user_role() in ('admin','receptionniste'))
  with check (hotel_id = current_hotel_id());

-- RESERVATIONS
create policy "reservations select" on reservations for select using (hotel_id = current_hotel_id());
create policy "reservations write" on reservations for all
  using (hotel_id = current_hotel_id() and current_user_role() in ('admin','receptionniste'))
  with check (hotel_id = current_hotel_id());

-- SHIFTS
create policy "shifts select" on shifts for select
  using (hotel_id = current_hotel_id() and (profile_id = auth.uid() or current_user_role() in ('admin','receptionniste')));
create policy "shifts admin write" on shifts for all
  using (hotel_id = current_hotel_id() and current_user_role() = 'admin')
  with check (hotel_id = current_hotel_id());

-- HOUSEKEEPING
create policy "hk select" on housekeeping_tasks for select using (hotel_id = current_hotel_id());
create policy "hk admin write" on housekeeping_tasks for all
  using (hotel_id = current_hotel_id() and current_user_role() in ('admin','receptionniste'))
  with check (hotel_id = current_hotel_id());
create policy "hk menage update" on housekeeping_tasks for update
  using (hotel_id = current_hotel_id() and current_user_role() = 'menage' and assignee_id = auth.uid())
  with check (hotel_id = current_hotel_id());

-- TIME CLOCK
create policy "pointage select" on time_clock for select
  using (hotel_id = current_hotel_id() and (profile_id = auth.uid() or current_user_role() = 'admin'));
create policy "pointage insert self" on time_clock for insert
  with check (hotel_id = current_hotel_id() and profile_id = auth.uid());
create policy "pointage update self" on time_clock for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- MENUS & MENU_ITEMS (lecture publique via QR : voir politique spécifique)
create policy "menus select interne" on menus for select using (hotel_id = current_hotel_id());
create policy "menus write" on menus for all
  using (hotel_id = current_hotel_id() and current_user_role() in ('admin','cuisine'))
  with check (hotel_id = current_hotel_id());

create policy "menu_items select interne" on menu_items for select using (hotel_id = current_hotel_id());
create policy "menu_items write" on menu_items for all
  using (hotel_id = current_hotel_id() and current_user_role() in ('admin','cuisine'))
  with check (hotel_id = current_hotel_id());

-- TABLES RESTAURANT
create policy "tables select" on restaurant_tables for select using (hotel_id = current_hotel_id());
create policy "tables write" on restaurant_tables for all
  using (hotel_id = current_hotel_id() and current_user_role() = 'admin')
  with check (hotel_id = current_hotel_id());

-- ORDERS
create policy "orders select" on orders for select using (hotel_id = current_hotel_id());
create policy "orders write" on orders for all
  using (hotel_id = current_hotel_id() and current_user_role() in ('admin','serveur','cuisine','receptionniste'))
  with check (hotel_id = current_hotel_id());

create policy "order_items select" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and o.hotel_id = current_hotel_id()));
create policy "order_items write" on order_items for all
  using (exists (select 1 from orders o where o.id = order_id and o.hotel_id = current_hotel_id())
         and current_user_role() in ('admin','serveur','cuisine'))
  with check (exists (select 1 from orders o where o.id = order_id and o.hotel_id = current_hotel_id()));

-- INVOICES & LINES & PAYMENTS
create policy "invoices select" on invoices for select using (hotel_id = current_hotel_id());
create policy "invoices write" on invoices for all
  using (hotel_id = current_hotel_id() and current_user_role() in ('admin','receptionniste','comptable'))
  with check (hotel_id = current_hotel_id());

create policy "invoice_lines select" on invoice_lines for select
  using (exists (select 1 from invoices i where i.id = invoice_id and i.hotel_id = current_hotel_id()));
create policy "invoice_lines write" on invoice_lines for all
  using (exists (select 1 from invoices i where i.id = invoice_id and i.hotel_id = current_hotel_id())
         and current_user_role() in ('admin','receptionniste','comptable'))
  with check (exists (select 1 from invoices i where i.id = invoice_id and i.hotel_id = current_hotel_id()));

create policy "payments select" on payments for select using (hotel_id = current_hotel_id());
create policy "payments write" on payments for all
  using (hotel_id = current_hotel_id() and current_user_role() in ('admin','receptionniste','comptable'))
  with check (hotel_id = current_hotel_id());

-- ============================================================================
-- 11. DONNÉES INITIALES (à exécuter manuellement après création du 1er user)
-- ============================================================================
-- Exemple :
-- insert into hotels (nom, slug, ville) values ('Hotel Demo', 'demo', 'Abidjan');
-- update profiles set hotel_id = '<uuid hotel>', role = 'admin' where id = auth.uid();
