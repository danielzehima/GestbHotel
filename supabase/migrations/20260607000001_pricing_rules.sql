-- ============================================================================
-- #10 Tarification avancée — règles de prix + codes promo
-- ============================================================================

-- Règles de tarification (saisonnalité, week-end, promotions)
CREATE TABLE IF NOT EXISTS pricing_rules (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      uuid        NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id  uuid        REFERENCES room_types(id) ON DELETE CASCADE, -- NULL = toutes les chambres
  nom           varchar(100) NOT NULL,
  type          varchar(20) NOT NULL CHECK (type IN ('saison', 'weekend', 'promo')),
  -- Pour type = 'saison' ou 'promo' : plage de dates
  date_debut    date,
  date_fin      date,
  -- Pour type = 'weekend' : jours de la semaine (0=dim, 1=lun, ..., 6=sam)
  days_of_week  integer[],
  -- Variation de prix en % : +20 = +20%, -15 = -15%
  modifier_pct  numeric(6,2) NOT NULL DEFAULT 0,
  priorite      integer NOT NULL DEFAULT 0,
  actif         boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Codes promo
CREATE TABLE IF NOT EXISTS promo_codes (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       uuid        NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  code           varchar(50) NOT NULL,
  description    varchar(200),
  discount_pct   numeric(6,2),       -- Réduction en %
  discount_fixed numeric(10,2),      -- Réduction montant fixe (FCFA)
  date_debut     date,
  date_fin       date,
  max_uses       integer,            -- NULL = illimité
  uses_count     integer NOT NULL DEFAULT 0,
  actif          boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, code)
);

-- Index pour les lookups fréquents
CREATE INDEX IF NOT EXISTS idx_pricing_rules_hotel ON pricing_rules(hotel_id, actif);
CREATE INDEX IF NOT EXISTS idx_promo_codes_hotel   ON promo_codes(hotel_id, actif);
CREATE INDEX IF NOT EXISTS idx_promo_codes_lookup  ON promo_codes(hotel_id, code, actif);

-- RLS
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes    ENABLE ROW LEVEL SECURITY;

-- pricing_rules : lecture par les membres de l'hôtel, écriture par admin
DROP POLICY IF EXISTS "pricing_rules_read"  ON pricing_rules;
DROP POLICY IF EXISTS "pricing_rules_write" ON pricing_rules;
DROP POLICY IF EXISTS "promo_codes_read"    ON promo_codes;
DROP POLICY IF EXISTS "promo_codes_write"   ON promo_codes;

CREATE POLICY "pricing_rules_read"
  ON pricing_rules FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE id = auth.uid() AND hotel_id IS NOT NULL
    )
  );

CREATE POLICY "pricing_rules_write"
  ON pricing_rules FOR ALL
  USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- promo_codes : lecture par les membres de l'hôtel, écriture par admin
CREATE POLICY "promo_codes_read"
  ON promo_codes FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE id = auth.uid() AND hotel_id IS NOT NULL
    )
  );

CREATE POLICY "promo_codes_write"
  ON promo_codes FOR ALL
  USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Accès public (service role) pour le moteur de réservation en ligne
-- Le client admin (service-role) contourne RLS → pas besoin de policy supplémentaire
