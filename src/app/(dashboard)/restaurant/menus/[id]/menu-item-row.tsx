'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Trash2, AlertCircle } from 'lucide-react';
import { formatMoney } from '@/lib/utils/format';
import { toggleItemAvailability, deleteMenuItem } from '../actions';

type Item = {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  disponible: boolean;
  allergenes: string[];
  temps_preparation_min: number | null;
};

export function MenuItemRow({
  item,
  menuId,
  canManage
}: {
  item: Item;
  menuId: string;
  canManage: boolean;
}) {
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const r = await toggleItemAvailability(item.id, !item.disponible);
      if (r.ok) toast.success(item.disponible ? 'Plat masqué' : 'Plat disponible');
      else toast.error(r.error);
    });
  }

  function onDelete() {
    if (!confirm(`Supprimer "${item.nom}" ?`)) return;
    start(async () => {
      const r = await deleteMenuItem(item.id);
      if (r.ok) toast.success('Plat supprimé');
      else toast.error(r.error);
    });
  }

  return (
    <div className={`flex items-start justify-between gap-3 p-4 border-b border-slate-100 last:border-b-0 ${!item.disponible ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-slate-900">{item.nom}</h4>
          {!item.disponible && (
            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-xs rounded">Indisponible</span>
          )}
          {item.temps_preparation_min && (
            <span className="text-xs text-slate-500">⏱ {item.temps_preparation_min} min</span>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-slate-600 mt-0.5">{item.description}</p>
        )}
        {item.allergenes && item.allergenes.length > 0 && (
          <div className="mt-1 flex items-center gap-1 text-xs text-amber-700">
            <AlertCircle className="w-3 h-3" />
            <span>Allergènes : {item.allergenes.join(', ')}</span>
          </div>
        )}
      </div>

      <div className="text-right flex items-center gap-3">
        <div className="font-bold text-slate-900">{formatMoney(Number(item.prix))}</div>
        {canManage && (
          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              disabled={pending}
              className={`relative inline-flex w-9 h-5 rounded-full transition ${
                item.disponible ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
              title={item.disponible ? 'Désactiver' : 'Activer'}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition ${
                  item.disponible ? 'translate-x-4' : ''
                }`}
              />
            </button>
            <Link
              href={`/restaurant/menus/${menuId}/items/${item.id}/edit`}
              className="text-brand-600 text-xs font-medium hover:underline px-2"
            >
              Modifier
            </Link>
            <button
              onClick={onDelete}
              disabled={pending}
              className="text-red-500 hover:bg-red-50 rounded p-1"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
