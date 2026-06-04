import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { RoomTypeForm } from '../../room-type-form';
import type { RoomType } from '@/types/domain';

export const metadata = { title: 'Modifier type — GestHotel' };

export default async function EditRoomTypePage(props: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['admin', 'receptionniste']);
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: type } = await supabase
    .from('room_types')
    .select('*')
    .eq('id', id)
    .eq('hotel_id', user.profile.hotel_id!)
    .single();

  if (!type) notFound();

  return (
    <div>
      <PageHeader title={`Modifier — ${(type as RoomType).libelle}`} />
      <RoomTypeForm initial={type as RoomType} />
    </div>
  );
}
