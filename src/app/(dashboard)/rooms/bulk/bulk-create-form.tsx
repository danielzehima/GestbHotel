'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { bulkCreateRooms } from '../actions';
import type { RoomType } from '@/types/domain';

export function BulkCreateForm({
  types,
  defaultTypeId
}: {
  types: RoomType[];
  defaultTypeId?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [prefixe, setPrefixe] = useState('');
  const [debut, setDebut] = useState(101);
  const [nombre, setNombre] = useState(10);
  const [etage, setEtage] = useState<string>('1');

  const preview = useMemo(() => {
    const items: string[] = [];
    for (let i = 0; i < Math.min(nombre, 5); i++) {
      items.push(`${prefixe}${debut + i}`);
    }
    if (nombre > 5) items.push(`… ${prefixe}${debut + nombre - 1}`);
    return items;
  }, [prefixe, debut, nombre]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await bulkCreateRooms(fd);
      if (r.ok) {
        toast.success(`${r.created ?? nombre} chambres créées`);
        router.push('/rooms');
      } else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-4">
      <Field label="Type de chambre" required>
        <Select name="room_type_id" defaultValue={defaultTypeId ?? ''} required>
          <option value="" disabled>— Sélectionner —</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.libelle}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Préfixe (optionnel)" hint="Ex: 'A' donnera A101, A102…">
          <Input name="prefixe" value={prefixe} onChange={(e) => setPrefixe(e.target.value)} maxLength={5} />
        </Field>
        <Field label="Étage">
          <Input name="etage" type="number" value={etage} onChange={(e) => setEtage(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Numéro de début" required>
          <Input
            name="numero_debut"
            type="number"
            min={0}
            value={debut}
            onChange={(e) => setDebut(Number(e.target.value))}
            required
          />
        </Field>
        <Field label="Nombre à créer" required hint="Max 100 à la fois">
          <Input
            name="nombre"
            type="number"
            min={1}
            max={100}
            value={nombre}
            onChange={(e) => setNombre(Number(e.target.value))}
            required
          />
        </Field>
      </div>

      <div className="bg-slate-50 rounded-lg p-3">
        <p className="text-xs text-slate-500 mb-1">Aperçu des chambres qui seront créées :</p>
        <p className="font-mono text-sm">{preview.join(', ')}</p>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Créer {nombre} chambres
        </Button>
      </div>
    </form>
  );
}
