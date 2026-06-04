import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { BulkCreateForm } from './bulk-create-form';
import type { RoomType } from '@/types/domain';

export const metadata = { title: 'Créer plusieurs chambres — GestHotel' };

export default async function BulkCreatePage(props: { searchParams: Promise<{ type?: string }> }) {
  const user = await requireRole(['admin', 'receptionniste']);
  const { type } = await props.searchParams;
  const supabase = await createClient();

  const { data: types } = await supabase
    .from('room_types')
    .select('*')
    .eq('hotel_id', user.profile.hotel_id!)
    .order('libelle');

  return (
    <div>
      <PageHeader
        title="Créer plusieurs chambres"
        description="Générez en une fois toutes les chambres d'un même type."
      />
      <BulkCreateForm types={(types ?? []) as RoomType[]} defaultTypeId={type} />
    </div>
  );
}
