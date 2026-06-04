'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

const schema = z.object({
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  telephone: z.string().optional(),
  nationalite: z.string().optional(),
  type_piece: z.string().optional(),
  numero_piece: z.string().optional(),
  date_naissance: z.string().optional().or(z.literal('')),
  adresse: z.string().optional(),
  notes: z.string().optional()
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function upsertGuest(formData: FormData, id?: string): Promise<ActionResult> {
  const user = await requireRole(['admin', 'receptionniste']);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();
  const payload = {
    hotel_id: user.profile.hotel_id!,
    nom: parsed.data.nom,
    prenom: parsed.data.prenom,
    email: parsed.data.email || null,
    telephone: parsed.data.telephone || null,
    nationalite: parsed.data.nationalite || null,
    type_piece: parsed.data.type_piece || null,
    numero_piece: parsed.data.numero_piece || null,
    date_naissance: parsed.data.date_naissance || null,
    adresse: parsed.data.adresse || null,
    notes: parsed.data.notes || null
  };

  const { error } = id
    ? await supabase.from('guests').update(payload).eq('id', id)
    : await supabase.from('guests').insert(payload);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/guests');
  return { ok: true };
}

export async function deleteGuest(id: string): Promise<ActionResult> {
  await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase.from('guests').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/guests');
  return { ok: true };
}
