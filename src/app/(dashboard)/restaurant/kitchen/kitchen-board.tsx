'use client';

import { useEffect, useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { ChefHat, Bell, Check, ClipboardList } from 'lucide-react';
import { updateOrderStatus } from '../orders/actions';
import { cn } from '@/lib/utils/cn';
import type { OrderStatus } from '@/types/database';

type OrderItem = {
  id: string;
  quantite: number;
  notes: string | null;
  menu_item: { nom: string; temps_preparation_min: number | null } | null;
};

type Order = {
  id: string;
  numero: string;
  type: 'sur_place' | 'room_service' | 'a_emporter';
  statut: OrderStatus;
  created_at: string;
  notes: string | null;
  table: { numero: string } | null;
  room: { numero: string } | null;
  items: OrderItem[];
};

const COLS: { status: OrderStatus; label: string; color: string; icon: any }[] = [
  { status: 'nouvelle', label: 'Nouvelles', color: 'border-slate-300 bg-slate-50', icon: ClipboardList },
  { status: 'en_preparation', label: 'En préparation', color: 'border-amber-300 bg-amber-50', icon: ChefHat },
  { status: 'prete', label: 'Prêtes', color: 'border-emerald-300 bg-emerald-50', icon: Bell }
];

const TYPE_LABEL: Record<Order['type'], string> = {
  sur_place: 'Sur place',
  room_service: 'Room service',
  a_emporter: 'À emporter'
};

function elapsed(iso: string, now: number) {
  const min = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (min < 1) return '< 1 min';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;
}

export function KitchenBoard({ orders }: { orders: Order[] }) {
  const [pending, start] = useTransition();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  function move(id: string, next: OrderStatus, msg: string) {
    start(async () => {
      const r = await updateOrderStatus(id, next);
      if (r.ok) toast.success(msg);
      else toast.error(r.error ?? 'Erreur');
    });
  }

  const byStatus = new Map<OrderStatus, Order[]>();
  COLS.forEach((c) => byStatus.set(c.status, []));
  orders.forEach((o) => {
    if (byStatus.has(o.statut)) byStatus.get(o.statut)!.push(o);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLS.map((col) => {
        const list = byStatus.get(col.status) ?? [];
        return (
          <div key={col.status} className={cn('rounded-xl border-2 p-3 min-h-[60vh]', col.color)}>
            <div className="flex items-center gap-2 mb-3">
              <col.icon className="w-5 h-5" />
              <h3 className="font-bold text-slate-900">{col.label}</h3>
              <span className="ml-auto bg-white px-2 py-0.5 rounded text-xs font-semibold">{list.length}</span>
            </div>

            <div className="space-y-3">
              {list.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Aucune commande</p>
              ) : (
                list.map((o) => {
                  const localisation =
                    o.type === 'sur_place' ? `Table ${o.table?.numero ?? '?'}` :
                    o.type === 'room_service' ? `Ch. ${o.room?.numero ?? '?'}` :
                    'À emporter';
                  return (
                    <div key={o.id} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-mono text-xs text-slate-500">{o.numero}</div>
                          <div className="font-bold text-sm">{localisation}</div>
                        </div>
                        <div className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                          {elapsed(o.created_at, now)}
                        </div>
                      </div>

                      <ul className="text-sm space-y-1 mb-3">
                        {o.items?.map((it) => (
                          <li key={it.id}>
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold">{it.quantite}×</span>
                              <span>{it.menu_item?.nom}</span>
                            </div>
                            {it.notes && (
                              <div className="text-xs text-amber-700 ml-6">📝 {it.notes}</div>
                            )}
                          </li>
                        ))}
                      </ul>

                      {o.notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-1.5 text-xs mb-2">
                          {o.notes}
                        </div>
                      )}

                      {col.status === 'nouvelle' && (
                        <button
                          onClick={() => move(o.id, 'en_preparation', 'Démarrée')}
                          disabled={pending}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 rounded transition"
                        >
                          Commencer ▶
                        </button>
                      )}
                      {col.status === 'en_preparation' && (
                        <button
                          onClick={() => move(o.id, 'prete', 'Prête')}
                          disabled={pending}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 rounded transition"
                        >
                          Marquer prête ✓
                        </button>
                      )}
                      {col.status === 'prete' && (
                        <button
                          onClick={() => move(o.id, 'servie', 'Servie')}
                          disabled={pending}
                          className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded transition"
                        >
                          Servie 🍽️
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
