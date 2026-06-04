'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export type ActionResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  profile_id: z.string().uuid(),
  date: z.string().min(10),
  type: z.enum(['matin', 'apres_midi', 'nuit', 'journee']),
  heure_debut: z.string(),
  heure_fin: z.string(),
  notes: z.string().optional()
});

export async function createShift(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(['admin']);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();
  const { error } = await supabase.from('shifts').insert({
    hotel_id: user.profile.hotel_id!,
    profile_id: parsed.data.profile_id,
    date: parsed.data.date,
    type: parsed.data.type,
    heure_debut: parsed.data.heure_debut,
    heure_fin: parsed.data.heure_fin,
    notes: parsed.data.notes || null
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/shifts');
  return { ok: true };
}

export async function deleteShift(id: string): Promise<ActionResult> {
  await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase.from('shifts').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/shifts');
  return { ok: true };
}
