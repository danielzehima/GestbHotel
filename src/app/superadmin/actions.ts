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
