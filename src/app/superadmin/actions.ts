'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireSuperadmin, clearSuperadminCookie } from '@/lib/superadmin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function superadminLogout() {
  await clearSuperadminCookie();
  redirect('/superadmin/login');
}

// ----- HÔTELS -----

export async function toggleHotelActive(id: string, actif: boolean): Promise<ActionResult> {
  await requireSuperadmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from('hotels').update({ actif }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/superadmin/hotels');
  revalidatePath('/superadmin');
  return { ok: true };
}

export async function deleteHotel(id: string): Promise<ActionResult> {
  await requireSuperadmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from('hotels').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/superadmin/hotels');
  return { ok: true };
}

/**
 * Active un forfait payant pour N mois. Si plan = 'trial', reset à l'essai 21 jours.
 */
export async function setHotelPlan(
  id: string,
  plan: 'trial' | 'basique' | 'standard' | 'premium',
  durationMonths: number
): Promise<ActionResult> {
  await requireSuperadmin();
  const supabase = createAdminClient();

  let plan_expires_at: string | null = null;

  if (plan === 'trial') {
    plan_expires_at = null; // trial = created_at + 21 jours (calculé côté code)
  } else {
    const d = new Date();
    d.setMonth(d.getMonth() + Math.max(1, durationMonths));
    plan_expires_at = d.toISOString();
  }

  const { error } = await supabase
    .from('hotels')
    .update({ plan, plan_expires_at })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/superadmin/hotels');
  return { ok: true };
}

/**
 * Prolonge l'essai gratuit de N jours supplémentaires.
 * Passe en plan = 'trial' avec plan_expires_at = maintenant + N jours.
 */
export async function extendTrial(id: string, days: number): Promise<ActionResult> {
  await requireSuperadmin();
  const supabase = createAdminClient();
  const d = new Date();
  d.setDate(d.getDate() + Math.max(1, days));
  const { error } = await supabase
    .from('hotels')
    .update({ plan: 'trial', plan_expires_at: d.toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/superadmin/hotels');
  return { ok: true };
}

// ----- TARIFS DES FORFAITS -----

export async function updatePlanPrice(
  plan: 'basique' | 'standard' | 'premium',
  data: {
    nom: string;
    prix_mensuel: number;
    description?: string;
    features: string[];
    highlight?: boolean;
    active?: boolean;
    ordre?: number;
  }
): Promise<ActionResult> {
  await requireSuperadmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('plan_prices')
    .upsert({
      plan,
      nom: data.nom,
      prix_mensuel: data.prix_mensuel,
      description: data.description ?? null,
      features: data.features,
      highlight: data.highlight ?? false,
      active: data.active ?? true,
      ordre: data.ordre ?? 0
    });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/superadmin/plans');
  revalidatePath('/superadmin');
  revalidatePath('/upgrade');
  revalidatePath('/');
  return { ok: true };
}

// ----- USERS -----
// Volontairement aucune action de modification : le super admin a un accès lecture seule.
// La gestion des utilisateurs (rôle, activation, suppression) est confiée aux admins de chaque hôtel
// via /staff dans leur dashboard.

// ----- MESSAGES -----

export async function markMessageHandled(id: string, traite: boolean): Promise<ActionResult> {
  await requireSuperadmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from('contact_messages').update({ traite }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/superadmin/messages');
  return { ok: true };
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  await requireSuperadmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from('contact_messages').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/superadmin/messages');
  return { ok: true };
}
