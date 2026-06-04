import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { MenuForm } from '../menu-form';

export const metadata = { title: 'Nouveau menu — GestHotel' };

export default async function NewMenuPage() {
  await requireRole(['admin', 'cuisine']);
  return (
    <div>
      <PageHeader title="Nouveau menu" />
      <MenuForm />
    </div>
  );
}
