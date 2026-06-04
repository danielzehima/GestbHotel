import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { RoomForm } from '../../room-form';
import type { Room, RoomType } from '@/types/domain';

export const metadata = { title: 'Modifier chambre — GestHotel' };

export default async function EditRoomPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['admin', 'receptionniste']);
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: room }, { data: types }] = await Promise.all([
    supabase.from('rooms').select('*').eq('id', id).eq('hotel_id', user.profile.hotel_id!).single(),
    supabase.from('room_types').select('*').eq('hotel_id', user.profile.hotel_id!).order('libelle')
  ]);

  if (!room) notFound();

  return (
    <div>
      <PageHeader title={`Chambre ${(room as Room).numero}`} />
      <RoomForm
        initial={room as Room}
        types={(types ?? []) as RoomType[]}
        canDelete={user.profile.role === 'admin'}
      />
    </div>
  );
}
