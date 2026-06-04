import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { ReservationForm } from '../../reservation-form';

export const metadata = { title: 'Modifier réservation — GestHotel' };

export default async function EditReservationPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['admin', 'receptionniste']);
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: res }, { data: rooms }, { data: types }, { data: guests }] = await Promise.all([
    supabase
      .from('reservations')
      .select('*, guest:guests(id, nom, prenom, email, telephone)')
      .eq('id', id)
      .eq('hotel_id', user.profile.hotel_id!)
      .single(),
    supabase
      .from('rooms')
      .select('id, numero, etage, room_type:room_types(id, libelle, prix_nuit)')
      .eq('hotel_id', user.profile.hotel_id!)
      .order('numero'),
    supabase
      .from('room_types')
      .select('id, libelle, prix_nuit')
      .eq('hotel_id', user.profile.hotel_id!)
      .order('libelle'),
    supabase
      .from('guests')
      .select('id, nom, prenom, email, telephone')
      .eq('hotel_id', user.profile.hotel_id!)
      .order('nom')
  ]);

  if (!res) notFound();
  const r = res as any;

  return (
    <div>
      <PageHeader title={`Modifier ${r.reference}`} />
      <ReservationForm
        rooms={(rooms ?? []) as any}
        types={(types ?? []) as any}
        guests={(guests ?? []) as any}
        initial={{
          id: r.id,
          guest_id: r.guest_id,
          room_id: r.room_id,
          room_type_id: r.room_type_id,
          date_arrivee: r.date_arrivee,
          date_depart: r.date_depart,
          nb_adultes: r.nb_adultes,
          nb_enfants: r.nb_enfants,
          prix_total: Number(r.prix_total),
          acompte: Number(r.acompte),
          source: r.source,
          notes: r.notes
        }}
        initialGuest={r.guest}
      />
    </div>
  );
}
