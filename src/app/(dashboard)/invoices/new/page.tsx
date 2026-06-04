import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { InvoiceForm } from './invoice-form';

export const metadata = { title: 'Nouvelle facture — GestHotel' };

export default async function NewInvoicePage() {
  const user = await requireRole(['admin', 'receptionniste', 'comptable']);
  const supabase = await createClient();

  const [{ data: guests }, { data: reservations }] = await Promise.all([
    supabase
      .from('guests')
      .select('id, nom, prenom')
      .eq('hotel_id', user.profile.hotel_id!)
      .order('nom')
      .limit(200),
    supabase
      .from('reservations')
      .select('id, reference, date_arrivee, date_depart, prix_total, guest:guests(nom, prenom), room:rooms(numero)')
      .eq('hotel_id', user.profile.hotel_id!)
      .in('statut', ['check_in', 'check_out', 'confirmee'])
      .order('date_arrivee', { ascending: false })
      .limit(50)
  ]);

  return (
    <div>
      <PageHeader title="Nouvelle facture" description="Manuelle ou générée depuis une réservation." />
      <InvoiceForm guests={(guests ?? []) as any} reservations={(reservations ?? []) as any} />
    </div>
  );
}
