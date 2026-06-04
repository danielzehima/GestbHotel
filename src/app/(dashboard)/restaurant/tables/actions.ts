'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export type ActionResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  numero: z.string().min(1).max(20),
  capacite: z.coerce.number().int().min(1).max(20),
  zone: z.string().optional(),
  active: z.coerce.boolean().optional()
});

function genQrToken() {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

export async function upsertTable(formData: FormData, id?: string): Promise<ActionResult> {
  const user = await requireRole(['admin']);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();

  const payload: any = {
    hotel_id: user.profile.hotel_id!,
    numero: parsed.data.numero,
    capacite: parsed.data.capacite,
    zone: parsed.data.zone || null,
    active: parsed.data.active ?? true
  };

  if (!id) payload.qr_code = genQrToken();

  const { error } = id
    ? await supabase.from('restaurant_tables').update(payload).eq('id', id)
    : await supabase.from('restaurant_tables').insert(payload);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/restaurant/tables');
  return { ok: true };
}

export async function regenerateQr(id: string): Promise<ActionResult> {
  await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase
    .from('restaurant_tables')
    .update({ qr_code: genQrToken() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/restaurant/tables');
  return { ok: true };
}

export async function deleteTable(id: string): Promise<ActionResult> {
  await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase.from('restaurant_tables').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/restaurant/tables');
  return { ok: true };
}
