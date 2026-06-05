'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole, requireUser } from '@/lib/auth';
import { getHotelPlanLimits, checkLimit } from '@/lib/plan-limits';
import type { RoomStatus } from '@/types/database';

async function countHotelRooms(hotelId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('rooms')
    .select('id', { count: 'exact', head: true })
    .eq('hotel_id', hotelId);
  return count ?? 0;
}

// ----- TYPES DE CHAMBRES -----

const roomTypeSchema = z.object({
  code: z.string().min(1).max(20),
  libelle: z.string().min(1).max(100),
  type: z.enum(['simple', 'double', 'twin', 'suite', 'familiale', 'deluxe']),
  capacite_adultes: z.coerce.number().int().min(1).max(10),
  capacite_enfants: z.coerce.number().int().min(0).max(10),
  prix_nuit: z.coerce.number().min(0),
  description: z.string().optional(),
  equipements: z.string().optional() // CSV
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function upsertRoomType(formData: FormData, id?: string): Promise<ActionResult> {
  const user = await requireRole(['admin', 'receptionniste']);
  const parsed = roomTypeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' };
  }

  const equipements =
    parsed.data.equipements
      ?.split(',')
      .map((e) => e.trim())
      .filter(Boolean) ?? [];

  const supabase = await createClient();
  const payload = {
    hotel_id: user.profile.hotel_id!,
    code: parsed.data.code,
    libelle: parsed.data.libelle,
    type: parsed.data.type,
    capacite_adultes: parsed.data.capacite_adultes,
    capacite_enfants: parsed.data.capacite_enfants,
    prix_nuit: parsed.data.prix_nuit,
    description: parsed.data.description || null,
    equipements
  };

  const { error } = id
    ? await supabase.from('room_types').update(payload).eq('id', id)
    : await supabase.from('room_types').insert(payload);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/rooms');
  revalidatePath('/rooms/types');
  return { ok: true };
}

export async function deleteRoomType(id: string): Promise<ActionResult> {
  await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase.from('room_types').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/rooms/types');
  return { ok: true };
}

// ----- CHAMBRES -----

const roomSchema = z.object({
  numero: z.string().min(1).max(20),
  room_type_id: z.string().uuid().optional().or(z.literal('')),
  etage: z.coerce.number().int().optional(),
  statut: z.enum(['disponible', 'occupee', 'nettoyage', 'maintenance', 'hors_service']),
  notes: z.string().optional()
});

export async function upsertRoom(formData: FormData, id?: string): Promise<ActionResult> {
  const user = await requireRole(['admin', 'receptionniste']);
  const parsed = roomSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' };
  }

  // Limite plan : uniquement à la création (pas à l'édition)
  if (!id) {
    const { limits, isExpired } = await getHotelPlanLimits(user.profile.hotel_id!);
    if (isExpired) return { ok: false, error: 'Votre forfait a expiré. Renouvelez-le pour ajouter des chambres.' };
    const current = await countHotelRooms(user.profile.hotel_id!);
    const limitErr = checkLimit(current, limits.maxRooms, 'chambre(s)');
    if (limitErr) return { ok: false, error: limitErr };
  }

  const supabase = await createClient();
  const payload = {
    hotel_id: user.profile.hotel_id!,
    numero: parsed.data.numero,
    room_type_id: parsed.data.room_type_id || null,
    etage: parsed.data.etage ?? null,
    statut: parsed.data.statut,
    notes: parsed.data.notes || null
  };

  const { error } = id
    ? await supabase.from('rooms').update(payload).eq('id', id)
    : await supabase.from('rooms').insert(payload);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/rooms');
  return { ok: true };
}

export async function deleteRoom(id: string): Promise<ActionResult> {
  await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/rooms');
  return { ok: true };
}

/**
 * Création en masse : génère N chambres consécutives d'un type donné.
 */
const bulkSchema = z.object({
  room_type_id: z.string().uuid(),
  prefixe: z.string().optional(),
  numero_debut: z.coerce.number().int().min(0),
  nombre: z.coerce.number().int().min(1).max(100),
  etage: z.coerce.number().int().optional()
});

export async function bulkCreateRooms(formData: FormData): Promise<ActionResult & { created?: number }> {
  const user = await requireRole(['admin', 'receptionniste']);
  const parsed = bulkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  // Vérif limite plan
  const { limits, isExpired } = await getHotelPlanLimits(user.profile.hotel_id!);
  if (isExpired) return { ok: false, error: 'Votre forfait a expiré. Renouvelez-le pour ajouter des chambres.' };
  const current = await countHotelRooms(user.profile.hotel_id!);
  if (current + parsed.data.nombre > limits.maxRooms) {
    const restant = Math.max(0, limits.maxRooms - current);
    return {
      ok: false,
      error: `Votre forfait permet ${limits.maxRooms} chambres maximum. Vous en avez ${current}, vous pouvez en créer ${restant} de plus seulement. Passez à un forfait supérieur pour plus.`
    };
  }

  const supabase = await createClient();
  const prefixe = parsed.data.prefixe ?? '';

  const rows = Array.from({ length: parsed.data.nombre }, (_, i) => ({
    hotel_id: user.profile.hotel_id!,
    room_type_id: parsed.data.room_type_id,
    numero: `${prefixe}${parsed.data.numero_debut + i}`,
    etage: parsed.data.etage ?? null,
    statut: 'disponible' as RoomStatus
  }));

  const { error, count } = await supabase
    .from('rooms')
    .insert(rows, { count: 'exact' });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/rooms');
  revalidatePath('/rooms/types');
  return { ok: true, created: count ?? rows.length };
}

export async function changeRoomStatus(id: string, statut: RoomStatus): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from('rooms').update({ statut }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/rooms');
  revalidatePath('/dashboard');
  return { ok: true };
}
