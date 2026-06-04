import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { TableForm } from '../table-form';

export const metadata = { title: 'Nouvelle table — GestHotel' };

export default async function NewTablePage() {
  await requireRole(['admin']);
  return (
    <div>
      <PageHeader title="Nouvelle table" />
      <TableForm />
    </div>
  );
}
