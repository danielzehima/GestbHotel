'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { ROOM_STATUS_LABELS } from '@/components/ui/room-status-badge';
import { upsertRoom, deleteRoom } from './actions';
import type { Room, RoomType } from '@/types/domain';
import type { RoomStatus } from '@/types/database';

const STATUSES: RoomStatus[] = ['disponible', 'occupee', 'nettoyage', 'maintenance', 'hors_service'];

export function RoomForm({
  initial,
  types,
  canDelete
}: {
  initial?: Room;
  types: RoomType[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleting, startDelete] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await upsertRoom(fd, initial?.id);
      if (r.ok) {
        toast.success(initial ? 'Chambre mise à jour' : 'Chambre créée');
        router.push('/rooms');
      } else toast.error(r.error);
    });
  }

  function onDelete() {
    if (!initial) return;
    if (!confirm(`Supprimer la chambre ${initial.numero} ? Action irréversible.`)) return;
    startDelete(async () => {
      const r = await deleteRoom(initial.id);
      if (r.ok) {
        toast.success('Chambre supprimée');
        router.push('/rooms');
      } else toast.error(r.error);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Numéro" required>
          <Input name="numero" defaultValue={initial?.numero} required maxLength={20} placeholder="101" />
        </Field>
        <Field label="Étage">
          <Input name="etage" type="number" defaultValue={initial?.etage ?? ''} placeholder="1" />
        </Field>
      </div>

      <Field label="Type de chambre" hint={types.length === 0 ? "Créez d'abord un type" : undefined}>
        <Select name="room_type_id" defaultValue={initial?.room_type_id ?? ''}>
          <option value="">— Aucun —</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.libelle}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Statut" required>
        <Select name="statut" defaultValue={initial?.statut ?? 'disponible'} required>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ROOM_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Notes internes">
        <Textarea name="notes" defaultValue={initial?.notes ?? ''} placeholder="Vue jardin, à rénover…" />
      </Field>

      <div className="flex justify-between pt-2 border-t border-slate-100">
        <div>
          {initial && canDelete && (
            <Button type="button" variant="danger" onClick={onDelete} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Supprimer
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </div>
    </form>
  );
}
