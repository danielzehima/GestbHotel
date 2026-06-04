'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { upsertRoomType } from '../actions';
import { ROOM_TYPE_LABELS, type RoomType } from '@/types/domain';

export function RoomTypeForm({ initial }: { initial?: RoomType }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await upsertRoomType(fd, initial?.id);
      if (r.ok) {
        toast.success(initial ? 'Type mis à jour' : 'Type créé');
        router.push('/rooms/types');
      } else toast.error(r.error);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Code" required>
          <Input name="code" defaultValue={initial?.code} required maxLength={20} placeholder="STD-D" />
        </Field>
        <Field label="Catégorie" required>
          <Select name="type" defaultValue={initial?.type ?? 'double'} required>
            {Object.entries(ROOM_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Libellé" required>
        <Input name="libelle" defaultValue={initial?.libelle} required placeholder="Chambre double standard" />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Adultes" required>
          <Input name="capacite_adultes" type="number" min={1} max={10} defaultValue={initial?.capacite_adultes ?? 2} required />
        </Field>
        <Field label="Enfants">
          <Input name="capacite_enfants" type="number" min={0} max={10} defaultValue={initial?.capacite_enfants ?? 0} />
        </Field>
        <Field label="Prix / nuit (XOF)" required>
          <Input name="prix_nuit" type="number" min={0} step={500} defaultValue={initial?.prix_nuit ?? 0} required />
        </Field>
      </div>

      <Field label="Équipements" hint="Séparés par des virgules (Wifi, TV, Climatisation…)">
        <Input name="equipements" defaultValue={initial?.equipements?.join(', ')} placeholder="Wifi, TV, Climatisation" />
      </Field>

      <Field label="Description">
        <Textarea name="description" defaultValue={initial?.description ?? ''} placeholder="Chambre lumineuse de 25m²…" />
      </Field>

      <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
