import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { RoomTypeForm } from '../room-type-form';

export const metadata = { title: 'Nouveau type — GestHotel' };

export default async function NewRoomTypePage() {
  await requireRole(['admin', 'receptionniste']);
  return (
    <div>
      <PageHeader title="Nouveau type de chambre" description="Définissez la catégorie, capacité et tarif." />
      <RoomTypeForm />
    </div>
  );
}
