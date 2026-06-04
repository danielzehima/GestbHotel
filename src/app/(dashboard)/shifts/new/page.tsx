import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { ShiftForm } from './shift-form';

export const metadata = { title: 'Nouveau shift — GestHotel' };

export default async function NewShiftPage() {
  const user = await requireRole(['admin']);
  const supabase = await createClient();
  const { data: staff } = await supabase
    .from('profiles')
    .select('id, nom, prenom, role')
    .eq('hotel_id', user.profile.hotel_id!)
    .order('nom');

  return (
    <div>
      <PageHeader title="Nouveau shift" />
      <ShiftForm staff={(staff ?? []) as any} />
    </div>
  );
}
