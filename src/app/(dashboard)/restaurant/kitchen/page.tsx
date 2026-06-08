import { ChefHat } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { KitchenBoard } from './kitchen-board';

export const metadata = { title: 'Cuisine — GestHotel' };

// Auto-refresh toutes les 15s (data fraîche sans WebSocket)
export const revalidate = 15;

export default async function KitchenPage() {
  const user = await requireRole(['admin', 'cuisine']);
  const supabase = await createClient();

  // Cuisine ne voit que les commandes actives (pas servies/annulées)
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { data: orders } = await supabase
    .from('orders')
    .select(
      `id, numero, type, statut, total, created_at, notes,
       table:restaurant_tables(numero),
       room:rooms(numero),
       items:order_items(id, quantite, notes, menu_item:menu_items(nom, temps_preparation_min))`
    )
    .eq('hotel_id', user.profile.hotel_id!)
    .in('statut', ['nouvelle', 'en_preparation', 'prete'])
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  // Appels serveur en attente
  const { data: calls } = await supabase
    .from('service_calls')
    .select('id, message, created_at, table:restaurant_tables(numero, zone)')
    .eq('hotel_id', user.profile.hotel_id!)
    .eq('statut', 'en_attente')
    .order('created_at', { ascending: true });

  return (
    <div>
      <PageHeader
        title="Cuisine"
        description="Vue temps réel des préparations. Auto-actualisation toutes les 12s."
      />

      <KitchenBoard orders={(orders ?? []) as any} calls={(calls ?? []) as any} />
    </div>
  );
}
