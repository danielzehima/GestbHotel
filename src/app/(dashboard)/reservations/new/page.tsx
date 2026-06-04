import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { ReservationForm } from '../reservation-form';

export const metadata = { title: 'Nouvelle réservation — GestHotel' };

export default async function NewReservationPage() {
  const user = await requireRole(['admin', 'receptionniste']);
  const supabase = await createClient();

  const [{ data: rooms }, { data: types }, { data: guests }] = await Promise.all([
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
      .limit(200)
  ]);

  return (
    <div>
      <PageHeader title="Nouvelle réservation" description="Renseignez le client, les dates et la chambre." />
      <ReservationForm
        rooms={(rooms ?? []) as any}
        types={(types ?? []) as any}
        guests={(guests ?? []) as any}
      />
    </div>
  );
}
