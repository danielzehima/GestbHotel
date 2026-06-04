import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { MenuItemForm } from '../menu-item-form';

export const metadata = { title: 'Nouveau plat — GestHotel' };

export default async function NewMenuItemPage(props: { params: Promise<{ id: string }> }) {
  await requireRole(['admin', 'cuisine']);
  const { id } = await props.params;
  return (
    <div>
      <PageHeader title="Nouveau plat" />
      <MenuItemForm menuId={id} />
    </div>
  );
}
