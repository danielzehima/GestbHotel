export type Plan = 'trial' | 'basique' | 'standard' | 'premium';

export const TRIAL_DAYS = 21;

export const PLAN_LABELS: Record<Plan, string> = {
  trial: 'Essai gratuit',
  basique: 'Basique',
  standard: 'Standard',
  premium: 'Premium'
};

// Prix mensuels (XOF) — sert au calcul MRR côté super admin
export const PLAN_PRICES: Record<Plan, number> = {
  trial: 0,
  basique: 15000,
  standard: 35000,
  premium: 75000
};

export const PLAN_COLORS: Record<Plan, string> = {
  trial: 'bg-amber-100 text-amber-800 border-amber-300',
  basique: 'bg-slate-100 text-slate-800 border-slate-300',
  standard: 'bg-brand-100 text-brand-800 border-brand-300',
  premium: 'bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-900 border-amber-400'
};

export type PlanStatus = {
  plan: Plan;
  planLabel: string;
  isTrial: boolean;
  expiresAt: Date | null;
  daysLeft: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // < 7 jours
  totalDays: number; // total de jours de la période (21 pour trial, 30 pour mensuel)
  daysUsed: number;
  progressPct: number;
};

/**
 * Met une date à minuit (00:00:00.000) — utilisé pour comparer des jours
 * calendaires sans tenir compte des heures.
 */
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function getPlanStatus(hotel: {
  plan?: Plan | null;
  plan_expires_at?: string | null;
  created_at: string;
}): PlanStatus {
  const plan = (hotel.plan ?? 'trial') as Plan;

  // Calcul de la date d'expiration
  let expiresAt: Date | null = null;
  let totalDays = 30;

  if (plan === 'trial') {
    // Normalisation : on raisonne en JOURS CALENDAIRES, pas en heures.
    // Hôtel créé à 22h55 le 5 juin → essai expire au matin du 26 juin (à 00h00).
    const start = startOfDay(new Date(hotel.created_at));
    expiresAt = new Date(start.getTime() + TRIAL_DAYS * 86400000);
    totalDays = TRIAL_DAYS;
  } else if (hotel.plan_expires_at) {
    expiresAt = startOfDay(new Date(hotel.plan_expires_at));
  }

  // On compare aussi "now" en début de jour pour rester cohérent
  const todayMidnight = startOfDay(new Date()).getTime();
  const daysLeft = expiresAt
    ? Math.max(0, Math.round((expiresAt.getTime() - todayMidnight) / 86400000))
    : Infinity;
  const isExpired = expiresAt ? expiresAt.getTime() <= todayMidnight : false;
  const isExpiringSoon = !isExpired && daysLeft <= 7;
  const daysUsed = Math.max(0, totalDays - daysLeft);
  const progressPct = totalDays > 0 ? Math.min(100, (daysUsed / totalDays) * 100) : 0;

  return {
    plan,
    planLabel: PLAN_LABELS[plan],
    isTrial: plan === 'trial',
    expiresAt,
    daysLeft: daysLeft === Infinity ? -1 : daysLeft,
    isExpired,
    isExpiringSoon,
    totalDays,
    daysUsed,
    progressPct
  };
}
