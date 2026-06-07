/**
 * Moteur de tarification avancée — GestHotel
 *
 * Logique :
 *  - Pour chaque nuit du séjour, on cherche les règles actives qui s'appliquent
 *  - On empile les modificateurs par type (saison/promo en priorité, weekend en bonus)
 *  - Prix nuit = base * (1 + saison_ou_promo/100) * (1 + weekend/100)
 *  - Si plusieurs règles du même type → la plus haute priorité gagne
 */

import { createAdminClient } from './supabase/admin';

export type PricingRule = {
  id: string;
  room_type_id: string | null;
  nom: string;
  type: 'saison' | 'weekend' | 'promo';
  date_debut: string | null;
  date_fin: string | null;
  days_of_week: number[] | null;
  modifier_pct: number;
  priorite: number;
};

export type PromoCode = {
  id: string;
  code: string;
  description: string | null;
  discount_pct: number | null;
  discount_fixed: number | null;
  date_debut: string | null;
  date_fin: string | null;
  max_uses: number | null;
  uses_count: number;
};

export type PricingResult = {
  /** Prix total pour toute la période */
  total: number;
  /** Prix moyen par nuit (arrondi) */
  avgPricePerNight: number;
  /** Détail nuit par nuit */
  nights: { date: string; price: number; rules: string[] }[];
  /** Réduction code promo appliquée */
  promoDiscount: number;
  /** Nom des règles actives (pour affichage) */
  activeRuleNames: string[];
};

/** Retourne toutes les règles actives d'un hôtel */
async function fetchRules(hotelId: string): Promise<PricingRule[]> {
  const sb = createAdminClient();
  const { data } = await sb
    .from('pricing_rules')
    .select('id, room_type_id, nom, type, date_debut, date_fin, days_of_week, modifier_pct, priorite')
    .eq('hotel_id', hotelId)
    .eq('actif', true);
  return (data ?? []) as PricingRule[];
}

/** Vérifie et retourne un code promo valide */
export async function validatePromoCode(
  hotelId: string,
  code: string,
  today: string = new Date().toISOString().slice(0, 10)
): Promise<PromoCode | null> {
  const sb = createAdminClient();
  const { data } = await sb
    .from('promo_codes')
    .select('id, code, description, discount_pct, discount_fixed, date_debut, date_fin, max_uses, uses_count')
    .eq('hotel_id', hotelId)
    .ilike('code', code.trim())
    .eq('actif', true)
    .maybeSingle();

  if (!data) return null;
  const p = data as PromoCode;

  // Vérifications
  if (p.date_debut && today < p.date_debut) return null;
  if (p.date_fin && today > p.date_fin) return null;
  if (p.max_uses !== null && p.uses_count >= p.max_uses) return null;

  return p;
}

/** Incrémente le compteur d'utilisation d'un code promo */
export async function incrementPromoUsage(promoId: string): Promise<void> {
  const sb = createAdminClient();
  await sb.rpc('increment_promo_usage', { promo_id: promoId }).maybeSingle();
  // Fallback si la fonction RPC n'existe pas :
  const { data: current } = await sb
    .from('promo_codes')
    .select('uses_count')
    .eq('id', promoId)
    .single();
  if (current) {
    await sb
      .from('promo_codes')
      .update({ uses_count: ((current as any).uses_count ?? 0) + 1 })
      .eq('id', promoId);
  }
}

/**
 * Calcule le prix effectif pour un séjour donné, en appliquant les règles actives.
 *
 * @param basePrice    Prix de base / nuit du type de chambre
 * @param arrivee      Date d'arrivée YYYY-MM-DD
 * @param depart       Date de départ YYYY-MM-DD
 * @param hotelId      ID de l'hôtel
 * @param roomTypeId   ID du type de chambre
 * @param promoCode    Code promo optionnel (déjà validé)
 */
export async function computeEffectivePrice(params: {
  basePrice: number;
  arrivee: string;
  depart: string;
  hotelId: string;
  roomTypeId: string;
  promo?: PromoCode | null;
}): Promise<PricingResult> {
  const { basePrice, arrivee, depart, hotelId, roomTypeId, promo } = params;

  const rules = await fetchRules(hotelId);
  const applicableRules = rules.filter(
    (r) => r.room_type_id === null || r.room_type_id === roomTypeId
  );

  // Génère chaque nuit du séjour (date = nuit du arrivee au depart-1)
  const nights: { date: string; price: number; rules: string[] }[] = [];
  const allRuleNames = new Set<string>();

  const d = new Date(arrivee + 'T00:00:00');
  const end = new Date(depart + 'T00:00:00');

  while (d < end) {
    const dateStr = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay(); // 0=dim, 6=sam
    const appliedRules: string[] = [];

    // Trouver la meilleure règle de type 'saison' ou 'promo' (la plus prioritaire)
    let mainModifier = 0;
    let bestPriority = -Infinity;
    for (const rule of applicableRules) {
      if (rule.type === 'weekend') continue;
      if (rule.date_debut && dateStr < rule.date_debut) continue;
      if (rule.date_fin && dateStr > rule.date_fin) continue;
      if (rule.priorite > bestPriority) {
        bestPriority = rule.priorite;
        mainModifier = rule.modifier_pct;
        appliedRules[0] = rule.nom;
      }
    }

    // Trouver la meilleure règle 'weekend' (empilée sur la saison)
    let weekendModifier = 0;
    let bestWeekendPriority = -Infinity;
    for (const rule of applicableRules) {
      if (rule.type !== 'weekend') continue;
      const days = rule.days_of_week ?? [0, 5, 6]; // défaut : ven, sam, dim
      if (!days.includes(dayOfWeek)) continue;
      if (rule.date_debut && dateStr < rule.date_debut) continue;
      if (rule.date_fin && dateStr > rule.date_fin) continue;
      if (rule.priorite > bestWeekendPriority) {
        bestWeekendPriority = rule.priorite;
        weekendModifier = rule.modifier_pct;
        if (!appliedRules.includes(rule.nom)) appliedRules.push(rule.nom);
      }
    }

    // Calcul prix nuit = base * (1 + main/100) * (1 + weekend/100)
    const price = Math.round(
      basePrice * (1 + mainModifier / 100) * (1 + weekendModifier / 100)
    );

    appliedRules.forEach((n) => allRuleNames.add(n));
    nights.push({ date: dateStr, price, rules: appliedRules });

    d.setDate(d.getDate() + 1);
  }

  let total = nights.reduce((s, n) => s + n.price, 0);
  const avgPricePerNight = nights.length > 0 ? Math.round(total / nights.length) : basePrice;

  // Application du code promo
  let promoDiscount = 0;
  if (promo) {
    if (promo.discount_pct != null) {
      promoDiscount = Math.round(total * promo.discount_pct / 100);
    } else if (promo.discount_fixed != null) {
      promoDiscount = Math.min(promo.discount_fixed, total);
    }
    total = Math.max(0, total - promoDiscount);
  }

  return {
    total,
    avgPricePerNight,
    nights,
    promoDiscount,
    activeRuleNames: Array.from(allRuleNames)
  };
}
