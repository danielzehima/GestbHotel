'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Power, Trash2, Loader2 } from 'lucide-react';
import { toggleHotelActive, deleteHotel } from '../../actions';

export function HotelActions({ id, actif, nom }: { id: string; actif: boolean; nom: string }) {
  const [pending, start] = useTransition();

  function onToggle() {
    start(async () => {
      const r = await toggleHotelActive(id, !actif);
      if (r.ok) toast.success(actif ? 'Hôtel suspendu' : 'Hôtel réactivé');
      else toast.error(r.error);
    });
  }

  function onDelete() {
    if (!confirm(`Supprimer définitivement "${nom}" ? Toutes les données (chambres, réservations, paiements) seront perdues.`)) return;
    start(async () => {
      const r = await deleteHotel(id);
      if (r.ok) toast.success('Hôtel supprimé');
      else toast.error(r.error);
    });
  }

  return (
    <div className="flex justify-end gap-1">
      <button
        onClick={onToggle}
        disabled={pending}
        title={actif ? 'Suspendre' : 'Réactiver'}
        className={`p-1.5 rounded ${actif ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
      </button>
      <button
        onClick={onDelete}
        disabled={pending}
        title="Supprimer"
        className="p-1.5 rounded text-red-600 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
