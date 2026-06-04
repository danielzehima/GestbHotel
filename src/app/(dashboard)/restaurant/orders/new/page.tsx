import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { OrderForm } from './order-form';

export const metadata = { title: 'Nouvelle commande — GestHotel' };

export default async function NewOrderPage() {
  const user = await requireRole(['admin', 'serveur', 'receptionniste']);
  const supabase = await createClient();

  const [{ data: items }, { data: tables }, { data: rooms }] = await Promise.all([
    supabase
      .from('menu_items')
      .select('id, nom, prix, categorie, disponible, menu:menus(nom)')
      .eq('hotel_id', user.profile.hotel_id!)
      .eq('disponible', true)
      .order('categorie')
      .order('nom'),
    supabase
      .from('restaurant_tables')
      .select('id, numero, zone')
      .eq('hotel_id', user.profile.hotel_id!)
      .eq('active', true)
      .order('numero'),
    supabase
      .from('rooms')
      .select('id, numero')
      .eq('hotel_id', user.profile.hotel_id!)
      .in('statut', ['occupee', 'disponible'])
      .order('numero')
  ]);

  return (
    <div>
      <PageHeader title="Nouvelle commande" />
      <OrderForm
        menuItems={(items ?? []) as any}
        tables={(tables ?? []) as any}
        rooms={(rooms ?? []) as any}
      />
    </div>
  );
}
