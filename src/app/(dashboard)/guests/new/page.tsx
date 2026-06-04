import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { GuestForm } from '../guest-form';

export const metadata = { title: 'Nouveau client — GestHotel' };

export default async function NewGuestPage() {
  await requireRole(['admin', 'receptionniste']);
  return (
    <div>
      <PageHeader title="Nouveau client" />
      <GuestForm canDelete={false} />
    </div>
  );
}
