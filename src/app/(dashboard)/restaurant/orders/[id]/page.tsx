import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { OrderStatusBadge } from '@/components/ui/order-status-badge';
import { formatMoney, formatDateTime } from '@/lib/utils/format';
import { OrderStatusActions } from './order-status-actions';

export const metadata = { title: 'Détail commande — GestHotel' };

const TYPE_LABELS: Record<string, string> = {
  sur_place: 'Sur place',
  room_service: 'Room service',
  a_emporter: 'À emporter'
};

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['admin', 'serveur', 'cuisine', 'receptionniste']);
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select(
      `*, table:restaurant_tables(numero, zone), room:rooms(numero),
       serveur:profiles!orders_serveur_id_fkey(nom, prenom),
       items:order_items(id, quantite, prix_unitaire, notes, total, menu_item:menu_items(nom))`
    )
    .eq('id', id)
    .eq('hotel_id', user.profile.hotel_id!)
    .single();

  if (!order) notFound();
  const o = order as any;

  return (
    <div>
      <Link
        href="/restaurant/orders"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Toutes les commandes
      </Link>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {o.numero}
            <OrderStatusBadge status={o.statut} />
          </span>
        }
        description={`${TYPE_LABELS[o.type]} · ${formatDateTime(o.created_at)}`}
        actions={<OrderStatusActions id={o.id} status={o.statut} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Plats commandés</h3>
          <div className="space-y-2">
            {o.items?.map((it: any) => (
              <div key={it.id} className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{it.quantite}×</span>
                    <span>{it.menu_item?.nom}</span>
                  </div>
                  {it.notes && <p className="text-xs text-slate-500 ml-7 mt-0.5">📝 {it.notes}</p>}
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">{formatMoney(Number(it.prix_unitaire))} × {it.quantite}</div>
                  <div className="font-semibold">{formatMoney(Number(it.total))}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t-2 border-slate-200 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatMoney(Number(o.total))}</span>
          </div>
          {o.notes && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded p-3 text-sm">
              <strong>Notes :</strong> {o.notes}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold mb-3">Informations</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Type</dt><dd className="font-medium">{TYPE_LABELS[o.type]}</dd></div>
            {o.table?.numero && <div className="flex justify-between"><dt className="text-slate-500">Table</dt><dd className="font-medium">{o.table.numero}</dd></div>}
            {o.room?.numero && <div className="flex justify-between"><dt className="text-slate-500">Chambre</dt><dd className="font-medium">{o.room.numero}</dd></div>}
            {o.serveur && <div className="flex justify-between"><dt className="text-slate-500">Serveur</dt><dd className="font-medium">{o.serveur.prenom} {o.serveur.nom}</dd></div>}
            <div className="flex justify-between"><dt className="text-slate-500">Créée</dt><dd>{formatDateTime(o.created_at)}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
