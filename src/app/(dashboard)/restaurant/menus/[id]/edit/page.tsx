import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { MenuForm } from '../../menu-form';

export const metadata = { title: 'Modifier menu — GestHotel' };

export default async function EditMenuPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['admin', 'cuisine']);
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: menu } = await supabase
    .from('menus')
    .select('*')
    .eq('id', id)
    .eq('hotel_id', user.profile.hotel_id!)
    .single();

  if (!menu) notFound();

  return (
    <div>
      <PageHeader title={`Modifier ${(menu as any).nom}`} />
      <MenuForm initial={menu as any} canDelete={user.profile.role === 'admin'} />
    </div>
  );
}
