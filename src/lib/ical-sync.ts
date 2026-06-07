/**
 * Channel Manager — moteur de synchronisation iCal.
 *
 * Export : construit le flux .ics d'un type de chambre (réservations actives).
 * Import : récupère les flux OTA, parse les events, crée/met à jour des
 *          réservations de blocage (statut 'confirmee', source 'ical:<nom>').
 *
 * Toutes les opérations utilisent le client service-role (bypass RLS) et sont
 * strictement filtrées par hotel_id.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { generateICalFeed, parseICalFeed, type ICalEvent } from '@/lib/ical';

// Statuts de réservation qui occupent réellement une chambre
const ACTIVE_STATUSES = ['en_attente', 'confirmee', 'check_in', 'check_out'];

// ── TOKEN D'EXPORT (sécurise les URLs publiques .ics) ────────────────────────

/**
 * Retourne le token iCal d'un hôtel (stocké dans hotels.parametres.ical_token),
 * en le générant à la première demande. Sert à signer les URLs d'export public.
 */
export async function getHotelIcalToken(hotelId: string): Promise<string | null> {
  const sb = createAdminClient();
  const { data: hotel } = await sb
    .from('hotels')
    .select('parametres')
    .eq('id', hotelId)
    .maybeSingle();
  if (!hotel) return null;

  const params = ((hotel as any).parametres ?? {}) as Record<string, any>;
  if (params.ical_token) return params.ical_token as string;

  // Génère un token aléatoire et le persiste
  const token = `ic_${crypto.randomUUID().replace(/-/g, '')}`;
  await sb
    .from('hotels')
    .update({ parametres: { ...params, ical_token: token } })
    .eq('id', hotelId);
  return token;
}

// ── EXPORT ───────────────────────────────────────────────────────────────────

/**
 * Construit le flux iCal d'un type de chambre : une période bloquée par
 * réservation active. Les blocages importés d'OTA sont exclus (anti-boucle).
 */
export async function buildExportFeed(params: {
  hotelId: string;
  roomTypeId: string;
}): Promise<string | null> {
  const { hotelId, roomTypeId } = params;
  const sb = createAdminClient();

  const [{ data: hotel }, { data: roomType }, { data: resas }] = await Promise.all([
    sb.from('hotels').select('nom').eq('id', hotelId).maybeSingle(),
    sb.from('room_types').select('libelle').eq('id', roomTypeId).eq('hotel_id', hotelId).maybeSingle(),
    sb.from('reservations')
      .select('id, reference, date_arrivee, date_depart, statut, ical_uid, room_type_id, room:rooms(room_type_id)')
      .eq('hotel_id', hotelId)
      .in('statut', ACTIVE_STATUSES),
  ]);

  if (!roomType) return null;

  // Filtrer les réservations de ce type de chambre :
  //  - réservations en ligne sans chambre assignée → room_type_id direct sur la résa
  //  - réservations avec chambre assignée → type de la chambre
  const events: ICalEvent[] = [];
  for (const r of (resas ?? []) as any[]) {
    const typeViaRoom = r.room?.room_type_id ?? null;
    const typeDirect = r.room_type_id ?? null;
    const matchesType = typeViaRoom === roomTypeId || typeDirect === roomTypeId;
    if (!matchesType) continue;

    // Ne pas ré-exporter un blocage importé d'une OTA (éviter les boucles)
    const isImported = !!r.ical_uid;
    const summary = isImported ? 'Indisponible' : `Réservé — ${r.reference}`;

    events.push({
      uid: `gesthotel-${r.id}@gesthotel`,
      start: r.date_arrivee,
      end: r.date_depart,
      summary,
    });
  }

  return generateICalFeed({
    calendarName: `${(hotel as any)?.nom ?? 'Hôtel'} — ${(roomType as any).libelle}`,
    events,
  });
}

// ── IMPORT ───────────────────────────────────────────────────────────────────

/** Récupère (ou crée) le client synthétique servant aux blocages OTA d'un hôtel. */
async function getOrCreateOtaGuest(hotelId: string): Promise<string | null> {
  const sb = createAdminClient();
  const MARKER = 'ical-block';

  const { data: existing } = await sb
    .from('guests')
    .select('id')
    .eq('hotel_id', hotelId)
    .eq('telephone', MARKER)
    .maybeSingle();

  if (existing) return (existing as any).id;

  const { data: created } = await sb
    .from('guests')
    .insert({
      hotel_id: hotelId,
      nom: 'OTA',
      prenom: 'Réservation',
      telephone: MARKER,
      notes: 'Client synthétique pour les blocages importés via Channel Manager (iCal).',
    })
    .select('id')
    .maybeSingle();

  return created ? (created as any).id : null;
}

export type FeedSyncResult = {
  feedId: string;
  nom: string;
  ok: boolean;
  parsed: number;       // nb d'events lus dans le flux .ics
  imported: number;     // nouveaux blocages créés
  updated: number;      // blocages existants mis à jour
  removed: number;      // blocages retirés (disparus côté OTA)
  insertErrors: string[]; // erreurs d'insertion éventuelles
  error?: string;       // erreur globale (fetch, parsing…)
};

/** Synchronise un flux iCal : importe les blocages, retire ceux disparus. */
async function syncOneFeed(feed: any): Promise<FeedSyncResult> {
  const sb = createAdminClient();
  const result: FeedSyncResult = {
    feedId: feed.id, nom: feed.nom, ok: false,
    parsed: 0, imported: 0, updated: 0, removed: 0, insertErrors: [],
  };

  try {
    // Cache-busting : force une réponse fraîche (évite le cache CDN qui pourrait
    // servir une version périmée de notre propre flux ou d'un flux OTA).
    const bustUrl = feed.url + (feed.url.includes('?') ? '&' : '?') + `_cb=${Date.now()}`;
    const res = await fetch(bustUrl, {
      headers: { 'User-Agent': 'GestHotel-ChannelManager/1.0', 'Cache-Control': 'no-cache' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const content = await res.text();

    // Contrôle de sanité : on doit recevoir de l'iCal, pas une page HTML d'erreur/login
    if (!content.includes('BEGIN:VCALENDAR')) {
      const preview = content.slice(0, 120).replace(/\s+/g, ' ').trim();
      throw new Error(`Réponse non-iCal reçue : "${preview}…"`);
    }
    const events = parseICalFeed(content);
    result.parsed = events.length;

    const guestId = await getOrCreateOtaGuest(feed.hotel_id);
    if (!guestId) throw new Error('Impossible de créer le client OTA');

    const seenUids = new Set<string>();
    let refCounter = 0;

    for (const ev of events) {
      // Garde-fou : iCal exige date_depart > date_arrivee (contrainte DB)
      if (ev.end <= ev.start) {
        result.insertErrors.push(`Période invalide (${ev.start} → ${ev.end}) ignorée`);
        continue;
      }

      // UID unique par feed pour éviter les collisions entre OTA
      const uid = `${feed.id}:${ev.uid}`;
      seenUids.add(uid);

      // Référence unique et courte (évite la collision sur unique(hotel_id, reference))
      refCounter++;
      const reference = `OTA-${feed.nom.slice(0, 3).toUpperCase()}-${Date.now().toString(36).slice(-4)}${refCounter}`.toUpperCase();

      // Upsert basé sur (hotel_id, ical_uid) — index unique garantit l'idempotence
      const { data: existing } = await sb
        .from('reservations')
        .select('id')
        .eq('hotel_id', feed.hotel_id)
        .eq('ical_uid', uid)
        .maybeSingle();

      const payload = {
        hotel_id: feed.hotel_id,
        room_type_id: feed.room_type_id,
        date_arrivee: ev.start,
        date_depart: ev.end,
        statut: 'confirmee' as const,
        source: `ical:${feed.nom}`,
        guest_id: guestId,
        ical_uid: uid,
        ical_feed_id: feed.id,
        notes: ev.summary,
      };

      if (existing) {
        const { error: upErr } = await sb.from('reservations')
          .update({ date_arrivee: ev.start, date_depart: ev.end, notes: ev.summary })
          .eq('id', (existing as any).id);
        if (upErr) result.insertErrors.push(`MAJ ${ev.start}: ${upErr.message}`);
        else result.updated++;
      } else {
        const { error: insErr } = await sb.from('reservations').insert({ ...payload, reference });
        if (insErr) result.insertErrors.push(`Insert ${ev.start}: ${insErr.message}`);
        else result.imported++;
      }
    }

    // Supprimer les blocages de ce feed dont l'UID a disparu (annulés côté OTA)
    const { data: existingBlocks } = await sb
      .from('reservations')
      .select('id, ical_uid')
      .eq('ical_feed_id', feed.id);

    for (const block of (existingBlocks ?? []) as any[]) {
      if (block.ical_uid && !seenUids.has(block.ical_uid)) {
        await sb.from('reservations').delete().eq('id', block.id);
        result.removed++;
      }
    }

    await sb.from('ical_feeds')
      .update({
        derniere_sync: new Date().toISOString(),
        derniere_erreur: null,
        events_count: events.length,
      })
      .eq('id', feed.id);

    result.ok = true;
  } catch (e: any) {
    result.error = e?.message ?? 'Erreur inconnue';
    await sb.from('ical_feeds')
      .update({ derniere_erreur: result.error })
      .eq('id', feed.id);
  }

  return result;
}

/** Synchronise tous les flux actifs d'un hôtel (bouton "Synchroniser maintenant"). */
export async function syncHotelFeeds(hotelId: string): Promise<FeedSyncResult[]> {
  const sb = createAdminClient();
  const { data: feeds } = await sb
    .from('ical_feeds')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('actif', true);

  const results: FeedSyncResult[] = [];
  for (const feed of (feeds ?? []) as any[]) {
    results.push(await syncOneFeed(feed));
  }
  return results;
}

/** Synchronise TOUS les flux actifs de tous les hôtels (cron). */
export async function syncAllFeeds(): Promise<{ feeds: number; imported: number; removed: number }> {
  const sb = createAdminClient();
  const { data: feeds } = await sb.from('ical_feeds').select('*').eq('actif', true);

  let imported = 0;
  let removed = 0;
  for (const feed of (feeds ?? []) as any[]) {
    const r = await syncOneFeed(feed);
    imported += r.imported;
    removed += r.removed;
  }
  return { feeds: (feeds ?? []).length, imported, removed };
}
