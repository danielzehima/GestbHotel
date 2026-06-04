'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { ReservationStatus } from '@/types/database';

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

// ----- SCHEMAS -----

const guestSchema = z.object({
  guest_id: z.string().uuid().optional().or(z.literal('')),
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  telephone: z.string().optional(),
  nationalite: z.string().optional(),
  type_piece: z.string().optional(),
  numero_piece: z.string().optional(),
  date_naissance: z.string().optional().or(z.literal('')),
  adresse: z.string().optional()
});

const reservationSchema = z.object({
  room_id: z.string().uuid().optional().or(z.literal('')),
  room_type_id: z.string().uuid().optional().or(z.literal('')),
  date_arrivee: z.string().min(10),
  date_depart: z.string().min(10),
  nb_adultes: z.coerce.number().int().min(1).max(10),
  nb_enfants: z.coerce.number().int().min(0).max(10),
  prix_total: z.coerce.number().min(0),
  acompte: z.coerce.number().min(0).default(0),
  source: z.string().optional(),
  notes: z.string().optional()
});

// ----- UTILS -----

function generateRef() {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rnd = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `RES-${ts}${rnd}`;
}

/**
 * Vérifie qu'aucune autre réservation active n'occupe la chambre sur la période.
 * Renvoie null si OK, sinon un message.
 */
async function checkRoomAvailability(
  hotelId: string,
  roomId: string,
  dateArrivee: string,
  dateDepart: string,
  excludeReservationId?: string
): Promise<string | null> {
  const supabase = await createClient();
  let query = supabase
    .from('reservations')
    .select('id, reference, date_arrivee, date_depart, statut')
    .eq('hotel_id', hotelId)
    .eq('room_id', roomId)
    .in('statut', ['en_attente', 'confirmee', 'check_in'])
    .lt('date_arrivee', dateDepart)
    .gt('date_depart', dateArrivee);

  if (excludeReservationId) query = query.neq('id', excludeReservationId);

  const { data } = await query;
  if (data && data.length > 0) {
    return `Chambre déjà réservée (${data[0].reference}) du ${data[0].date_arrivee} au ${data[0].date_depart}.`;
  }
  return null;
}

// ----- ACTIONS -----

export async function createReservation(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole(['admin', 'receptionniste']);
  const fd = Object.fromEntries(formData);

  const guestParsed = guestSchema.safeParse(fd);
  const resParsed = reservationSchema.safeParse(fd);

  if (!guestParsed.success) return { ok: false, error: guestParsed.error.issues[0]?.message ?? 'Client invalide' };
  if (!resParsed.success) return { ok: false, error: resParsed.error.issues[0]?.message ?? 'Réservation invalide' };

  if (resParsed.data.date_depart <= resParsed.data.date_arrivee) {
    return { ok: false, error: 'La date de départ doit être après la date d\'arrivée.' };
  }

  const supabase = await createClient();
  const hotelId = user.profile.hotel_id!;

  // 1. Guest : réutiliser ou créer
  let guestId = guestParsed.data.guest_id || null;
  if (!guestId) {
    const { data: inserted, error: gErr } = await supabase
      .from('guests')
      .insert({
        hotel_id: hotelId,
        nom: guestParsed.data.nom,
        prenom: guestParsed.data.prenom,
        email: guestParsed.data.email || null,
        telephone: guestParsed.data.telephone || null,
        nationalite: guestParsed.data.nationalite || null,
        type_piece: guestParsed.data.type_piece || null,
        numero_piece: guestParsed.data.numero_piece || null,
        date_naissance: guestParsed.data.date_naissance || null,
        adresse: guestParsed.data.adresse || null
      })
      .select('id')
      .single();
    if (gErr || !inserted) return { ok: false, error: gErr?.message ?? 'Erreur création client' };
    guestId = inserted.id;
  }

  // 2. Dispo chambre
  if (resParsed.data.room_id) {
    const conflict = await checkRoomAvailability(
      hotelId,
      resParsed.data.room_id,
      resParsed.data.date_arrivee,
      resParsed.data.date_depart
    );
    if (conflict) return { ok: false, error: conflict };
  }

  // 3. Insert réservation
  const { data: created, error } = await supabase
    .from('reservations')
    .insert({
      hotel_id: hotelId,
      reference: generateRef(),
      guest_id: guestId,
      room_id: resParsed.data.room_id || null,
      room_type_id: resParsed.data.room_type_id || null,
      date_arrivee: resParsed.data.date_arrivee,
      date_depart: resParsed.data.date_depart,
      nb_adultes: resParsed.data.nb_adultes,
      nb_enfants: resParsed.data.nb_enfants,
      prix_total: resParsed.data.prix_total,
      acompte: resParsed.data.acompte,
      source: resParsed.data.source || null,
      notes: resParsed.data.notes || null,
      statut: 'confirmee' as ReservationStatus,
      created_by: user.profile.id
    })
    .select('id')
    .single();

  if (error || !created) return { ok: false, error: error?.message ?? 'Erreur création' };

  revalidatePath('/reservations');
  revalidatePath('/dashboard');
  return { ok: true, data: { id: created.id } };
}

export async function updateReservation(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRole(['admin', 'receptionniste']);
  const parsed = reservationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };
  if (parsed.data.date_depart <= parsed.data.date_arrivee) {
    return { ok: false, error: 'Date de départ invalide.' };
  }

  const supabase = await createClient();
  const hotelId = user.profile.hotel_id!;

  if (parsed.data.room_id) {
    const conflict = await checkRoomAvailability(
      hotelId,
      parsed.data.room_id,
      parsed.data.date_arrivee,
      parsed.data.date_depart,
      id
    );
    if (conflict) return { ok: false, error: conflict };
  }

  const { error } = await supabase
    .from('reservations')
    .update({
      room_id: parsed.data.room_id || null,
      room_type_id: parsed.data.room_type_id || null,
      date_arrivee: parsed.data.date_arrivee,
      date_depart: parsed.data.date_depart,
      nb_adultes: parsed.data.nb_adultes,
      nb_enfants: parsed.data.nb_enfants,
      prix_total: parsed.data.prix_total,
      acompte: parsed.data.acompte,
      source: parsed.data.source || null,
      notes: parsed.data.notes || null
    })
    .eq('id', id)
    .eq('hotel_id', hotelId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/reservations');
  revalidatePath(`/reservations/${id}`);
  return { ok: true };
}

export async function checkIn(id: string): Promise<ActionResult> {
  const user = await requireRole(['admin', 'receptionniste']);
  const supabase = await createClient();

  const { data: res } = await supabase
    .from('reservations')
    .select('room_id, statut')
    .eq('id', id)
    .eq('hotel_id', user.profile.hotel_id!)
    .single();

  if (!res) return { ok: false, error: 'Réservation introuvable' };
  if (res.statut === 'check_in') return { ok: false, error: 'Déjà en arrivée' };
  if (!res.room_id) return { ok: false, error: 'Aucune chambre assignée' };

  const { error } = await supabase
    .from('reservations')
    .update({ statut: 'check_in', check_in_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  await supabase.from('rooms').update({ statut: 'occupee' }).eq('id', res.room_id);

  revalidatePath('/reservations');
  revalidatePath(`/reservations/${id}`);
  revalidatePath('/rooms');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function checkOut(id: string): Promise<ActionResult> {
  const user = await requireRole(['admin', 'receptionniste']);
  const supabase = await createClient();

  const { data: res } = await supabase
    .from('reservations')
    .select('room_id, statut')
    .eq('id', id)
    .eq('hotel_id', user.profile.hotel_id!)
    .single();

  if (!res) return { ok: false, error: 'Réservation introuvable' };
  if (res.statut !== 'check_in') return { ok: false, error: 'Le client n\'est pas en arrivée' };

  const { error } = await supabase
    .from('reservations')
    .update({ statut: 'check_out', check_out_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  if (res.room_id) {
    await supabase.from('rooms').update({ statut: 'nettoyage' }).eq('id', res.room_id);
  }

  revalidatePath('/reservations');
  revalidatePath(`/reservations/${id}`);
  revalidatePath('/rooms');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function cancelReservation(id: string): Promise<ActionResult> {
  await requireRole(['admin', 'receptionniste']);
  const supabase = await createClient();
  const { error } = await supabase
    .from('reservations')
    .update({ statut: 'annulee' })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/reservations');
  revalidatePath(`/reservations/${id}`);
  return { ok: true };
}
