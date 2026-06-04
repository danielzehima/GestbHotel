import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { TableForm } from '../../table-form';

export const metadata = { title: 'Modifier table — GestHotel' };

export default async function EditTablePage(props: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['admin']);
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: table } = await supabase
    .from('restaurant_tables')
    .select('*')
    .eq('id', id)
    .eq('hotel_id', user.profile.hotel_id!)
    .single();

  if (!table) notFound();

  return (
    <div>
      <PageHeader title={`Table ${(table as any).numero}`} />
      <TableForm initial={table as any} />
    </div>
  );
}
