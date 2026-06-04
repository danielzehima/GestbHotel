import Link from 'next/link';
import { Plus, ClipboardList } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { OrderStatusBadge } from '@/components/ui/order-status-badge';
import { formatMoney, formatDateTime } from '@/lib/utils/format';

export const metadata = { title: 'Commandes — GestHotel' };

const TYPE_LABELS: Record<string, string> = {
  sur_place: 'Sur place',
  room_service: 'Room service',
  a_emporter: 'À emporter'
};

export default async function OrdersPage() {
  const user = await requireRole(['admin', 'serveur', 'cuisine', 'receptionniste']);
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, numero, type, statut, total, created_at, table:restaurant_tables(numero), room:rooms(numero)')
    .eq('hotel_id', user.profile.hotel_id!)
    .order('created_at', { ascending: false })
    .limit(100);

  const canCreate = ['admin', 'serveur', 'receptionniste'].includes(user.profile.role);

  return (
    <div>
      <PageHeader
        title="Commandes"
        description="Prise de commande et suivi en temps réel."
        actions={
          canCreate && (
            <Link href="/restaurant/orders/new">
              <Button>
                <Plus className="w-4 h-4" />
                Nouvelle commande
              </Button>
            </Link>
          )
        }
      />

      {!orders || orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune commande"
          description="Créez votre première commande."
          action={
            canCreate && (
              <Link href="/restaurant/orders/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Nouvelle commande
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">N°</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Localisation</th>
                <th className="text-left px-4 py-3">Heure</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-center px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{o.numero}</td>
                  <td className="px-4 py-3 text-slate-600">{TYPE_LABELS[o.type]}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {o.table?.numero && `Table ${o.table.numero}`}
                    {o.room?.numero && `Ch. ${o.room.numero}`}
                    {!o.table && !o.room && '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDateTime(o.created_at)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatMoney(Number(o.total))}</td>
                  <td className="px-4 py-3 text-center"><OrderStatusBadge status={o.statut} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/restaurant/orders/${o.id}`} className="text-brand-600 hover:underline text-xs font-medium">
                      Détails →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
