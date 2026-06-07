'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { syncHotelFeeds, type FeedSyncResult } from '@/lib/ical-sync';

export type ActionResult = { ok: true } | { ok: false; error: string };

// ── Ajout / édition d'un flux iCal externe (import OTA) ──────────────────────

const feedSchema = z.object({
  nom: z.string().min(1, 'Nom requis').max(50),
  room_type_id: z.string().uuid('Type de chambre requis'),
  url: z.string().url('URL invalide').max(1000),
});

export async function addIcalFeed(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(['admin']);
  const parsed = feedSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  // Vérifier que .ics est plausible
  const url = parsed.data.url.trim();

  const supabase = await createClient();
  const { error } = await supabase.from('ical_feeds').insert({
    hotel_id: user.profile.hotel_id!,
    room_type_id: parsed.data.room_type_id,
    nom: parsed.data.nom,
    url,
    actif: true,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/channels');
  return { ok: true };
}

export async function deleteIcalFeed(id: string): Promise<ActionResult> {
  await requireRole(['admin']);
  const supabase = await createClient();
  // La suppression CASCADE retire aussi les réservations de blocage liées
  const { error } = await supabase.from('ical_feeds').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/channels');
  return { ok: true };
}

export async function toggleIcalFeed(id: string, actif: boolean): Promise<ActionResult> {
  await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase.from('ical_feeds').update({ actif }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/channels');
  return { ok: true };
}

// ── Synchronisation manuelle ("Synchroniser maintenant") ─────────────────────

export type SyncResult =
  | { ok: true; results: FeedSyncResult[] }
  | { ok: false; error: string };

export async function syncNow(): Promise<SyncResult> {
  const user = await requireRole(['admin']);
  try {
    const results = await syncHotelFeeds(user.profile.hotel_id!);
    revalidatePath('/channels');
    revalidatePath('/reservations');
    return { ok: true, results };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Erreur de synchronisation' };
  }
}
