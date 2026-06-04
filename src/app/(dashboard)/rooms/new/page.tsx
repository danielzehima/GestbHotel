import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { RoomForm } from '../room-form';
import type { RoomType } from '@/types/domain';

export const metadata = { title: 'Nouvelle chambre — GestHotel' };

export default async function NewRoomPage() {
  const user = await requireRole(['admin', 'receptionniste']);
  const supabase = await createClient();
  const { data: types } = await supabase
    .from('room_types')
    .select('*')
    .eq('hotel_id', user.profile.hotel_id!)
    .order('libelle');

  return (
    <div>
      <PageHeader title="Nouvelle chambre" />
      <RoomForm types={(types ?? []) as RoomType[]} canDelete={false} />
    </div>
  );
}
