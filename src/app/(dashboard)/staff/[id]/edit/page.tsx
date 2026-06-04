import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { StaffForm } from './staff-form';

export const metadata = { title: 'Modifier employé — GestHotel' };

export default async function EditStaffPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['admin']);
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nom, prenom, telephone, role, actif, hotel_id')
    .eq('id', id)
    .single();

  if (!profile || profile.hotel_id !== user.profile.hotel_id) notFound();

  return (
    <div>
      <PageHeader title={`${(profile as any).prenom} ${(profile as any).nom}`} />
      <StaffForm initial={profile as any} isSelf={profile.id === user.id} />
    </div>
  );
}
