'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

const schema = z.object({
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  telephone: z.string().optional(),
  role: z.enum(['admin', 'receptionniste', 'menage', 'serveur', 'cuisine', 'comptable']),
  actif: z.coerce.boolean().optional()
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateStaff(id: string, formData: FormData): Promise<ActionResult> {
  const user = await requireRole(['admin']);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();

  // Garde-fou : on ne modifie que les profils du même hôtel
  const { data: target } = await supabase
    .from('profiles')
    .select('hotel_id')
    .eq('id', id)
    .single();
  if (!target || target.hotel_id !== user.profile.hotel_id) {
    return { ok: false, error: 'Profil hors de votre hôtel' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      nom: parsed.data.nom,
      prenom: parsed.data.prenom,
      telephone: parsed.data.telephone || null,
      role: parsed.data.role,
      actif: parsed.data.actif ?? true
    })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/staff');
  return { ok: true };
}

export async function attachToHotel(profileId: string): Promise<ActionResult> {
  const user = await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ hotel_id: user.profile.hotel_id, role: 'receptionniste' })
    .eq('id', profileId)
    .is('hotel_id', null);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/staff');
  return { ok: true };
}
