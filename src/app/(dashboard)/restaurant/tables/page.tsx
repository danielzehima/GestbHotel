import Link from 'next/link';
import { Plus, QrCode } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TableCard } from './table-card';

export const metadata = { title: 'Tables — GestHotel' };

export default async function TablesPage() {
  const user = await requireRole(['admin', 'serveur', 'receptionniste']);
  const supabase = await createClient();

  const [{ data: tables }, { data: hotel }] = await Promise.all([
    supabase
      .from('restaurant_tables')
      .select('*')
      .eq('hotel_id', user.profile.hotel_id!)
      .order('numero'),
    supabase
      .from('hotels')
      .select('slug')
      .eq('id', user.profile.hotel_id!)
      .single()
  ]);

  const canManage = user.profile.role === 'admin';
  const hotelSlug = (hotel as any)?.slug ?? '';

  return (
    <div>
      <PageHeader
        title="Tables du restaurant"
        description="Chaque table possède un QR code unique pointant vers la carte."
        actions={
          canManage && (
            <Link href="/restaurant/tables/new">
              <Button>
                <Plus className="w-4 h-4" />
                Nouvelle table
              </Button>
            </Link>
          )
        }
      />

      {!tables || tables.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="Aucune table enregistrée"
          description="Créez une table — un QR code unique sera généré automatiquement."
          action={
            canManage && (
              <Link href="/restaurant/tables/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Nouvelle table
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((t: any) => (
            <TableCard
              key={t.id}
              table={t}
              hotelSlug={hotelSlug}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
