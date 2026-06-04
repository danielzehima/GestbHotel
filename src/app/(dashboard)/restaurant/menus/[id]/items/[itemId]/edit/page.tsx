import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { MenuItemForm } from '../../menu-item-form';

export const metadata = { title: 'Modifier plat — GestHotel' };

export default async function EditMenuItemPage(props: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await requireRole(['admin', 'cuisine']);
  const { id, itemId } = await props.params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', itemId)
    .eq('hotel_id', user.profile.hotel_id!)
    .single();

  if (!item) notFound();

  return (
    <div>
      <PageHeader title={`Modifier ${(item as any).nom}`} />
      <MenuItemForm menuId={id} initial={item as any} />
    </div>
  );
}
