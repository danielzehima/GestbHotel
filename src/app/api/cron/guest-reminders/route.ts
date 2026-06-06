import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendArrivalReminderEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron quotidien : envoie un rappel d'arrivée aux clients dont le séjour
 * commence DEMAIN (réservations confirmées avec email client).
 * Sécurité : CRON_SECRET (header Bearer ou ?secret=). Idempotent (1×/jour).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    const qs = new URL(req.url).searchParams.get('secret');
    if (auth !== `Bearer ${secret}` && qs !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const sb = createAdminClient();

  const { data: resas, error } = await sb
    .from('reservations')
    .select(
      `reference, date_arrivee, date_depart, prix_total, acompte, hotel_id,
       guest:guests(prenom, email),
       room:rooms(numero, room_type:room_types(libelle)),
       room_type:room_types(libelle)`
    )
    .eq('date_arrivee', tomorrow)
    .eq('statut', 'confirmee');

  if (error) {
    console.error('[cron guest-reminders]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Hôtels concernés (nom/devise/téléphone) en une requête
  const hotelIds = Array.from(new Set((resas ?? []).map((r: any) => r.hotel_id)));
  const hotelMap = new Map<string, any>();
  if (hotelIds.length > 0) {
    const { data: hotels } = await sb
      .from('hotels')
      .select('id, nom, devise, telephone')
      .in('id', hotelIds);
    for (const h of hotels ?? []) hotelMap.set((h as any).id, h);
  }

  let sent = 0;
  for (const r of (resas ?? []) as any[]) {
    if (!r.guest?.email) continue;
    const hotel = hotelMap.get(r.hotel_id) ?? {};
    const nights = Math.round(
      (new Date(r.date_depart).getTime() - new Date(r.date_arrivee).getTime()) / 86400000
    );
    const roomLabel = r.room?.room_type?.libelle || r.room_type?.libelle || r.room?.numero || 'Chambre';

    await sendArrivalReminderEmail({
      to: r.guest.email,
      prenom: r.guest.prenom,
      hotelNom: hotel.nom ?? '',
      reference: r.reference,
      roomLabel,
      arrivee: r.date_arrivee,
      depart: r.date_depart,
      nights,
      prixTotal: Number(r.prix_total),
      restant: Number(r.prix_total) - Number(r.acompte),
      devise: hotel.devise ?? 'XOF',
      hotelTel: hotel.telephone ?? null
    });
    sent++;
  }

  console.info(`[cron guest-reminders] ${sent} rappel(s) d'arrivée envoyé(s)`);
  return NextResponse.json({ ok: true, checked: resas?.length ?? 0, sent });
}
