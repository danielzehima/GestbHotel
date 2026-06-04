import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { GuestForm } from '../../guest-form';

export const metadata = { title: 'Modifier client — GestHotel' };

export default async function EditGuestPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['admin', 'receptionniste']);
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: guest } = await supabase
    .from('guests')
    .select('*')
    .eq('id', id)
    .eq('hotel_id', user.profile.hotel_id!)
    .single();

  if (!guest) notFound();

  return (
    <div>
      <PageHeader title={`${(guest as any).prenom} ${(guest as any).nom}`} />
      <GuestForm initial={guest as any} canDelete={user.profile.role === 'admin'} />
    </div>
  );
}
