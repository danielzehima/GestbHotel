'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole, requireUser } from '@/lib/auth';

export type ActionResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  room_id: z.string().uuid(),
  assignee_id: z.string().uuid().optional().or(z.literal('')),
  date_prevue: z.string().min(10),
  priorite: z.coerce.number().int().min(1).max(3).default(1),
  description: z.string().optional()
});

export async function createTask(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(['admin', 'receptionniste']);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();
  const { error } = await supabase.from('housekeeping_tasks').insert({
    hotel_id: user.profile.hotel_id!,
    room_id: parsed.data.room_id,
    assignee_id: parsed.data.assignee_id || null,
    date_prevue: parsed.data.date_prevue,
    priorite: parsed.data.priorite,
    description: parsed.data.description || null,
    statut: 'a_faire',
    created_by: user.profile.id
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/housekeeping');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function assignTask(id: string, assigneeId: string): Promise<ActionResult> {
  await requireRole(['admin', 'receptionniste']);
  const supabase = await createClient();
  const { error } = await supabase
    .from('housekeeping_tasks')
    .update({ assignee_id: assigneeId || null })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/housekeeping');
  return { ok: true };
}

export async function startTask(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('housekeeping_tasks')
    .update({ statut: 'en_cours', debut_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  // Optionnel : passer la chambre en nettoyage si pas déjà
  const { data: task } = await supabase
    .from('housekeeping_tasks')
    .select('room_id')
    .eq('id', id)
    .single();
  if (task) {
    await supabase.from('rooms').update({ statut: 'nettoyage' }).eq('id', task.room_id);
  }

  revalidatePath('/housekeeping');
  revalidatePath('/rooms');
  return { ok: true };
}

export async function completeTask(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('housekeeping_tasks')
    .update({ statut: 'terminee', fin_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/housekeeping');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function verifyTask(id: string): Promise<ActionResult> {
  const user = await requireRole(['admin', 'receptionniste']);
  const supabase = await createClient();

  const { data: task } = await supabase
    .from('housekeeping_tasks')
    .select('room_id')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('housekeeping_tasks')
    .update({
      statut: 'verifiee',
      verifie_par: user.profile.id,
      verifie_at: new Date().toISOString()
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  // Chambre vérifiée → disponible
  if (task) {
    await supabase.from('rooms').update({ statut: 'disponible' }).eq('id', task.room_id);
  }

  revalidatePath('/housekeeping');
  revalidatePath('/rooms');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  await requireRole(['admin', 'receptionniste']);
  const supabase = await createClient();
  const { error } = await supabase.from('housekeeping_tasks').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/housekeeping');
  return { ok: true };
}
