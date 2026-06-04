'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function clockIn(): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  // Empêche un nouveau pointage si un est encore ouvert
  const { data: open } = await supabase
    .from('time_clock')
    .select('id')
    .eq('profile_id', user.profile.id)
    .is('pointage_out', null)
    .limit(1);

  if (open && open.length > 0) {
    return { ok: false, error: 'Un pointage est déjà ouvert. Pointez votre sortie d\'abord.' };
  }

  const { error } = await supabase.from('time_clock').insert({
    hotel_id: user.profile.hotel_id!,
    profile_id: user.profile.id,
    pointage_in: new Date().toISOString()
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/clock');
  return { ok: true };
}

export async function clockOut(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('time_clock')
    .update({ pointage_out: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/clock');
  return { ok: true };
}
