-- ============================================================================
-- Système d'abonnement : essai gratuit 21 jours + forfaits payants
-- ============================================================================

-- Colonnes
alter table hotels
  add column if not exists plan text not null default 'trial'
    check (plan in ('trial', 'basique', 'standard', 'premium')),
  add column if not exists plan_expires_at timestamptz;

-- L'essai expire 21 jours après l'inscription
-- plan_expires_at est NULL initialement pour les essais (calculé à partir de created_at)
-- Pour les forfaits payants, plan_expires_at est explicitement défini

comment on column hotels.plan is 'Forfait actuel : trial | basique | standard | premium';
comment on column hotels.plan_expires_at is 'Date d''expiration. NULL pour trial (=created_at + 21j) ou plan à vie';
