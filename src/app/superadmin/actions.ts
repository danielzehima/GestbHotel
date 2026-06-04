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

// ----- USERS -----

export async function toggleUserActive(id: string, actif: boolean): Promise<ActionResult> {
  await requireSuperadmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from('profiles').update({ actif }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/superadmin/users');
  return { ok: true };
}

export async function changeUserRole(id: string, role: string): Promise<ActionResult> {
  await requireSuperadmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/superadmin/users');
  return { ok: true };
}

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
