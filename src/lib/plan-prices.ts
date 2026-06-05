import { createClient } from '@/lib/supabase/server';
import type { Plan } from '@/lib/plan';

export type PlanPrice = {
  plan: Exclude<Plan, 'trial'>;
  nom: string;
  prix_mensuel: number;
  description: string | null;
  features: string[];
  highlight: boolean;
  active: boolean;
  ordre: number;
};

// Fallback si la table plan_prices n'existe pas encore (migration non appliquée)
const FALLBACK: PlanPrice[] = [
  {
    plan: 'basique', nom: 'Basique', prix_mensuel: 15000,
    description: 'Petits hôtels et maisons d\'hôtes.',
    features: ['Jusqu\'à 10 chambres', 'Réservations', 'Facturation manuelle', '2 utilisateurs', 'Support email'],
    highlight: false, active: true, ordre: 1
  },
  {
    plan: 'standard', nom: 'Standard', prix_mensuel: 35000,
    description: 'Hôtels moyens avec restaurant.',
    features: ['Jusqu\'à 40 chambres', 'Restaurant + QR', 'Mobile Money', 'Plannings', '10 utilisateurs'],
    highlight: true, active: true, ordre: 2
  },
  {
    plan: 'premium', nom: 'Premium', prix_mensuel: 75000,
    description: 'Groupes hôteliers.',
    features: ['Chambres illimitées', 'Multi-établissements', 'Domaine perso', 'Support 24/7'],
    highlight: false, active: true, ordre: 3
  }
];

/**
 * Récupère les tarifs depuis la DB. En cas d'erreur (migration absente),
 * renvoie un fallback hardcodé pour ne jamais casser l'affichage.
 */
export async function getPlanPrices(): Promise<PlanPrice[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('plan_prices')
      .select('*')
      .order('ordre');

    if (error || !data || data.length === 0) {
      console.warn('[plan-prices] fallback used:', error?.message ?? 'no data');
      return FALLBACK;
    }
    return data.map((d: any) => ({
      plan: d.plan,
      nom: d.nom,
      prix_mensuel: Number(d.prix_mensuel),
      description: d.description,
      features: Array.isArray(d.features) ? d.features : [],
      highlight: !!d.highlight,
      active: !!d.active,
      ordre: d.ordre ?? 0
    }));
  } catch (e) {
    console.error('[plan-prices] exception:', e);
    return FALLBACK;
  }
}

/**
 * Retourne uniquement le prix mensuel d'un plan (sert au MRR superadmin).
 */
export async function getPlanPrice(plan: Plan): Promise<number> {
  if (plan === 'trial') return 0;
  const prices = await getPlanPrices();
  return prices.find((p) => p.plan === plan)?.prix_mensuel ?? 0;
}
