-- ============================================================================
-- Table plan_prices : tarifs modifiables par le super admin
-- ============================================================================

create table if not exists plan_prices (
  plan text primary key check (plan in ('basique', 'standard', 'premium')),
  nom text not null,
  prix_mensuel numeric(12, 2) not null,
  description text,
  features jsonb not null default '[]'::jsonb,
  highlight boolean not null default false,
  active boolean not null default true,
  ordre int not null default 0,
  updated_at timestamptz default now()
);

-- Trigger updated_at
drop trigger if exists trg_plan_prices_updated_at on plan_prices;
create trigger trg_plan_prices_updated_at before update on plan_prices
  for each row execute function set_updated_at();

-- RLS : lecture publique, modification super admin uniquement
alter table plan_prices enable row level security;

drop policy if exists "plan_prices read public" on plan_prices;
create policy "plan_prices read public"
  on plan_prices for select
  to public
  using (true);

drop policy if exists "plan_prices write super admin" on plan_prices;
create policy "plan_prices write super admin"
  on plan_prices for all
  using (current_user_role() = 'super_admin')
  with check (current_user_role() = 'super_admin');

-- Seed initial avec les 3 forfaits
insert into plan_prices (plan, nom, prix_mensuel, description, features, highlight, ordre) values
  ('basique', 'Basique', 15000,
   'Petits hôtels et maisons d''hôtes (jusqu''à 10 chambres).',
   '["Jusqu''à 10 chambres","Réservations & calendrier","Gestion des clients","Facturation manuelle","2 utilisateurs maximum","Support par email"]'::jsonb,
   false, 1),
  ('standard', 'Standard', 35000,
   'Hôtels moyens avec restaurant (jusqu''à 40 chambres).',
   '["Jusqu''à 40 chambres","Tout le plan Basique","Restaurant + QR code","Interface cuisine","Paiements Mobile Money","Plannings du personnel","Pointage employés","10 utilisateurs","Support prioritaire"]'::jsonb,
   true, 2),
  ('premium', 'Premium', 75000,
   'Groupes hôteliers et grandes structures.',
   '["Chambres illimitées","Tout le plan Standard","Multi-établissements","Rapports avancés","Domaine personnalisé","Utilisateurs illimités","Support dédié 24/7","Formation sur site"]'::jsonb,
   false, 3)
on conflict (plan) do nothing;
