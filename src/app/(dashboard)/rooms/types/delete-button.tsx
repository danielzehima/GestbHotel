'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { deleteRoomType } from '../actions';

export function DeleteRoomTypeButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handle() {
    if (!confirm('Supprimer ce type ? Les chambres associées perdront leur lien de type.')) return;
    startTransition(async () => {
      const r = await deleteRoomType(id);
      if (r.ok) toast.success('Type supprimé');
      else toast.error(r.error);
    });
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="text-red-600 hover:underline text-xs font-medium disabled:opacity-50"
    >
      Supprimer
    </button>
  );
}
