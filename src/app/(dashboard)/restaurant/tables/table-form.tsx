'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { upsertTable } from './actions';

type Table = {
  id: string;
  numero: string;
  capacite: number;
  zone: string | null;
  active: boolean;
};

export function TableForm({ initial }: { initial?: Table }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await upsertTable(fd, initial?.id);
      if (r.ok) {
        toast.success(initial ? 'Table mise à jour' : 'Table créée');
        router.push('/restaurant/tables');
      } else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Numéro" required>
          <Input name="numero" defaultValue={initial?.numero} required maxLength={20} placeholder="T01" />
        </Field>
        <Field label="Capacité" required>
          <Input name="capacite" type="number" min={1} max={20} defaultValue={initial?.capacite ?? 2} required />
        </Field>
      </div>
      <Field label="Zone" hint="Terrasse, intérieur, bar…">
        <Input name="zone" defaultValue={initial?.zone ?? ''} />
      </Field>
      <Field label="Active">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} value="true" />
          Table disponible
        </label>
      </Field>
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={() => router.back()}>Annuler</Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
