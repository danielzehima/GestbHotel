import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Calcul de disponibilité pour le moteur de réservation en ligne (public).
 * Utilise le client service-role car la RLS réserve rooms/reservations au tenant.
 * Toutes les requêtes sont strictement filtrées par hotel_id → pas de fuite cross-tenant.
 */

// Statuts de réservation qui "consomment" une chambre sur la période
const ACTIVE_STATUSES = ['en_attente', 'confirmee', 'check_in'];
// Statuts de chambre non réservables en ligne
const UNBOOKABLE_ROOM_STATUSES = ['hors_service', 'maintenance'];

export type HotelPaymentInfo = {
  numero?: string | null;
  nom?: string | null;
  acompte_pct?: number;
};

export type PublicHotel = {
  id: string;
  nom: string;
  slug: string;
  ville: string | null;
  devise: string;
  logo_url: string | null;
  telephone: string | null;
  email: string | null;
  actif: boolean;
  paiement: HotelPaymentInfo;
};

export type AvailableRoomType = {
  id: string;
  libelle: string;
  type: string;
  capacite_adultes: number;
  capacite_enfants: number;
  prix_nuit: number;
  description: string | null;
  photos: string[];
  equipements: string[];
  available: number;
};

export async function getPublicHotelBySlug(slug: string): Promise<PublicHotel | null> {
  const sb = createAdminClient();
  const { data } = await sb
    .from('hotels')
    .select('id, nom, slug, ville, devise, logo_url, telephone, email, actif, parametres')
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return null;
  const d = data as any;
  return {
    id: d.id,
    nom: d.nom,
    slug: d.slug,
    ville: d.ville,
    devise: d.devise,
    logo_url: d.logo_url,
    telephone: d.telephone,
    email: d.email,
    actif: d.actif,
    paiement: (d.parametres?.paiement ?? {}) as HotelPaymentInfo
  };
}

/** Nombre de nuits entre deux dates (format YYYY-MM-DD). */
export function nightsBetween(arrivee: string, depart: string): number {
  const a = new Date(arrivee + 'T00:00:00');
  const d = new Date(depart + 'T00:00:00');
  return Math.round((d.getTime() - a.getTime()) / 86400000);
}

/**
 * Renvoie les types de chambres disponibles pour la période et la capacité demandées.
 */
export async function searchAvailability(params: {
  hotelId: string;
  arrivee: string;
  depart: string;
  adultes: number;
  enfants: number;
}): Promise<AvailableRoomType[]> {
  const { hotelId, arrivee, depart, adultes, enfants } = params;
  const sb = createAdminClient();

  const [{ data: types }, { data: rooms }, { data: reservations }] = await Promise.all([
    sb.from('room_types')
      .select('id, libelle, type, capacite_adultes, capacite_enfants, prix_nuit, description, photos, equipements')
      .eq('hotel_id', hotelId),
    sb.from('rooms').select('id, room_type_id, statut').eq('hotel_id', hotelId),
    sb.from('reservations')
      .select('id, room_id, room_type_id')
      .eq('hotel_id', hotelId)
      .in('statut', ACTIVE_STATUSES)
      .lt('date_arrivee', depart)
      .gt('date_depart', arrivee)
  ]);

  if (!types || types.length === 0) return [];

  // Map room_id -> room_type_id, et comptage des chambres réservables par type
  const roomToType = new Map<string, string | null>();
  const bookableByType = new Map<string, number>();
  for (const r of (rooms ?? []) as any[]) {
    roomToType.set(r.id, r.room_type_id);
    if (!UNBOOKABLE_ROOM_STATUSES.includes(r.statut) && r.room_type_id) {
      bookableByType.set(r.room_type_id, (bookableByType.get(r.room_type_id) ?? 0) + 1);
    }
  }

  // Comptage des réservations actives qui chevauchent, attribuées à un type
  const usedByType = new Map<string, number>();
  for (const res of (reservations ?? []) as any[]) {
    const typeId = res.room_id ? roomToType.get(res.room_id) ?? res.room_type_id : res.room_type_id;
    if (typeId) usedByType.set(typeId, (usedByType.get(typeId) ?? 0) + 1);
  }

  return (types as any[])
    .map((t) => {
      const total = bookableByType.get(t.id) ?? 0;
      const used = usedByType.get(t.id) ?? 0;
      const available = Math.max(0, total - used);
      return {
        id: t.id,
        libelle: t.libelle,
        type: t.type,
        capacite_adultes: t.capacite_adultes ?? 0,
        capacite_enfants: t.capacite_enfants ?? 0,
        prix_nuit: Number(t.prix_nuit),
        description: t.description,
        photos: Array.isArray(t.photos) ? t.photos : [],
        equipements: Array.isArray(t.equipements) ? t.equipements : [],
        available
      } as AvailableRoomType;
    })
    .filter(
      (t) =>
        t.available > 0 &&
        t.capacite_adultes >= adultes &&
        t.capacite_enfants >= enfants
    );
}
