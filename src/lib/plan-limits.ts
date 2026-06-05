import { createAdminClient } from '@/lib/supabase/admin';
import type { Plan } from '@/lib/plan';

export type PlanLimits = {
  maxRooms: number;          // Infinity = illimité
  maxUsers: number;
  restaurant: boolean;       // Accès aux modules /restaurant
  mobileMoney: boolean;      // Méthodes Wave/OM/MTN/Moov dans paiements
  exports: boolean;          // Exports CSV/Excel (futur)
  customDomain: boolean;     // Domaine perso (futur)
  prioritySupport: boolean;
  multiHotel: boolean;       // Plusieurs hôtels par admin (futur)
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  trial: {
    // Essai : on offre l'expérience STANDARD complète pour convertir
    maxRooms: 40,
    maxUsers: 10,
    restaurant: true,
    mobileMoney: true,
    exports: false,
    customDomain: false,
    prioritySupport: false,
    multiHotel: false
  },
  basique: {
    maxRooms: 10,
    maxUsers: 2,
    restaurant: false,
    mobileMoney: false,
    exports: false,
    customDomain: false,
    prioritySupport: false,
    multiHotel: false
  },
  standard: {
    maxRooms: 40,
    maxUsers: 10,
    restaurant: true,
    mobileMoney: true,
    exports: false,
    customDomain: false,
    prioritySupport: true,
    multiHotel: false
  },
  premium: {
    maxRooms: Infinity,
    maxUsers: Infinity,
    restaurant: true,
    mobileMoney: true,
    exports: true,
    customDomain: true,
    prioritySupport: true,
    multiHotel: true
  }
};

/**
 * Récupère plan + limites pour un hôtel donné.
 * Si l'essai est expiré et qu'aucun forfait n'est actif → renvoie 'trial' avec limites bloquantes.
 */
export async function getHotelPlanLimits(hotelId: string): Promise<{
  plan: Plan;
  limits: PlanLimits;
  isExpired: boolean;
}> {
  try {
    const admin = createAdminClient();
    const { data: hotel } = await admin
      .from('hotels')
      .select('plan, plan_expires_at, created_at')
      .eq('id', hotelId)
      .maybeSingle();

    if (!hotel) {
      return { plan: 'trial', limits: PLAN_LIMITS.trial, isExpired: false };
    }

    const plan = ((hotel as any).plan ?? 'trial') as Plan;
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.trial;

    // Détecter expiration
    let isExpired = false;
    if (plan === 'trial') {
      const created = new Date((hotel as any).created_at);
      const expires = new Date(created.getTime() + 21 * 86400000);
      isExpired = expires.getTime() < Date.now();
    } else if ((hotel as any).plan_expires_at) {
      isExpired = new Date((hotel as any).plan_expires_at).getTime() < Date.now();
    }

    return { plan, limits, isExpired };
  } catch (e) {
    console.error('[plan-limits] error:', e);
    return { plan: 'trial', limits: PLAN_LIMITS.trial, isExpired: false };
  }
}

/**
 * Vérifie qu'une feature est activable. Renvoie un message d'erreur ou null si OK.
 */
export function checkFeature(
  limits: PlanLimits,
  feature: keyof PlanLimits
): string | null {
  if (limits[feature]) return null;
  return `Cette fonctionnalité n'est pas incluse dans votre forfait. Passez à un forfait supérieur pour y accéder.`;
}

/**
 * Vérifie qu'on n'a pas dépassé une limite numérique.
 */
export function checkLimit(
  current: number,
  max: number,
  label: string
): string | null {
  if (max === Infinity || current < max) return null;
  return `Limite atteinte : votre forfait permet ${max} ${label} maximum. Passez à un forfait supérieur pour augmenter cette limite.`;
}
