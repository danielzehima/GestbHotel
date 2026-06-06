'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPublicHotelBySlug, searchAvailability, nightsBetween } from '@/lib/availability';
import { sendBookingGuestConfirmation, sendBookingHotelNotification } from '@/lib/email';

export type BookingResult =
  | { ok: true; reference: string }
  | { ok: false; error: string };

const schema = z.object({
  hotelSlug: z.string().min(1),
  room_type_id: z.string().uuid(),
  date_arrivee: z.string().min(10),
  date_depart: z.string().min(10),
  nb_adultes: z.coerce.number().int().min(1).max(20),
  nb_enfants: z.coerce.number().int().min(0).max(20),
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  email: z.string().email('Email invalide'),
  telephone: z.string().min(4, 'Téléphone requis').max(30)
});

function generateRef() {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rnd = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `WEB-${ts}${rnd}`;
}

/**
 * Crée une demande de réservation depuis le site public.
 * Statut 'en_attente' → l'hôtel confirme et assigne une chambre.
 */
export async function createPublicBooking(formData: FormData): Promise<BookingResult> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' };
  }
  const d = parsed.data;

  if (d.date_depart <= d.date_arrivee) {
    return { ok: false, error: "La date de départ doit être après l'arrivée." };
  }
  if (d.date_arrivee < new Date().toISOString().slice(0, 10)) {
    return { ok: false, error: "La date d'arrivée ne peut pas être dans le passé." };
  }

  const hotel = await getPublicHotelBySlug(d.hotelSlug);
  if (!hotel || !hotel.actif) {
    return { ok: false, error: 'Hôtel indisponible.' };
  }

  // Re-vérification de disponibilité côté serveur (anti-surréservation)
  const available = await searchAvailability({
    hotelId: hotel.id,
    arrivee: d.date_arrivee,
    depart: d.date_depart,
    adultes: d.nb_adultes,
    enfants: d.nb_enfants
  });
  const roomType = available.find((t) => t.id === d.room_type_id);
  if (!roomType) {
    return { ok: false, error: "Désolé, ce type de chambre n'est plus disponible pour ces dates." };
  }

  const nights = nightsBetween(d.date_arrivee, d.date_depart);
  const prixTotal = roomType.prix_nuit * nights;

  const sb = createAdminClient();

  // 1. Client
  const { data: guest, error: gErr } = await sb
    .from('guests')
    .insert({
      hotel_id: hotel.id,
      nom: d.nom,
      prenom: d.prenom,
      email: d.email,
      telephone: d.telephone
    })
    .select('id')
    .single();
  if (gErr || !guest) return { ok: false, error: "Erreur lors de l'enregistrement du client." };

  // 2. Réservation (en attente de confirmation par l'hôtel)
  const reference = generateRef();
  const { error: rErr } = await sb.from('reservations').insert({
    hotel_id: hotel.id,
    reference,
    guest_id: (guest as any).id,
    room_type_id: d.room_type_id,
    date_arrivee: d.date_arrivee,
    date_depart: d.date_depart,
    nb_adultes: d.nb_adultes,
    nb_enfants: d.nb_enfants,
    prix_total: prixTotal,
    acompte: 0,
    statut: 'en_attente',
    source: 'site_web'
  });
  if (rErr) {
    console.error('[booking] insert reservation:', rErr.message);
    return { ok: false, error: 'Erreur lors de la création de la réservation.' };
  }

  // 3. Emails (non bloquants)
  const common = {
    reference,
    hotelNom: hotel.nom,
    roomLabel: roomType.libelle,
    arrivee: d.date_arrivee,
    depart: d.date_depart,
    nights,
    prixTotal,
    devise: hotel.devise,
    guestNom: d.nom,
    guestPrenom: d.prenom,
    guestEmail: d.email,
    guestTel: d.telephone
  };
  sendBookingGuestConfirmation({ to: d.email, ...common, paiement: hotel.paiement }).catch((e) =>
    console.error('[booking] guest email:', e?.message)
  );
  if (hotel.email) {
    sendBookingHotelNotification({ to: hotel.email, ...common }).catch((e) =>
      console.error('[booking] hotel email:', e?.message)
    );
  }

  return { ok: true, reference };
}
