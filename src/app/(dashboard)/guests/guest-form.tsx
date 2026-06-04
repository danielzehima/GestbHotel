'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { upsertGuest, deleteGuest } from './actions';

type Guest = {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  nationalite: string | null;
  type_piece: string | null;
  numero_piece: string | null;
  date_naissance: string | null;
  adresse: string | null;
  notes: string | null;
};

export function GuestForm({ initial, canDelete }: { initial?: Guest; canDelete: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleting, startDel] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await upsertGuest(fd, initial?.id);
      if (r.ok) {
        toast.success(initial ? 'Client mis à jour' : 'Client créé');
        router.push('/guests');
      } else toast.error(r.error);
    });
  }

  function onDelete() {
    if (!initial) return;
    if (!confirm(`Supprimer ${initial.prenom} ${initial.nom} ?`)) return;
    startDel(async () => {
      const r = await deleteGuest(initial.id);
      if (r.ok) {
        toast.success('Client supprimé');
        router.push('/guests');
      } else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-6 max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom" required>
          <Input name="prenom" defaultValue={initial?.prenom} required maxLength={100} />
        </Field>
        <Field label="Nom" required>
          <Input name="nom" defaultValue={initial?.nom} required maxLength={100} />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" defaultValue={initial?.email ?? ''} />
        </Field>
        <Field label="Téléphone">
          <Input name="telephone" defaultValue={initial?.telephone ?? ''} />
        </Field>
        <Field label="Nationalité">
          <Input name="nationalite" defaultValue={initial?.nationalite ?? ''} />
        </Field>
        <Field label="Date de naissance">
          <Input name="date_naissance" type="date" defaultValue={initial?.date_naissance ?? ''} />
        </Field>
        <Field label="Type de pièce">
          <Select name="type_piece" defaultValue={initial?.type_piece ?? ''}>
            <option value="">—</option>
            <option value="CNI">CNI</option>
            <option value="Passeport">Passeport</option>
            <option value="Permis">Permis de conduire</option>
            <option value="Carte consulaire">Carte consulaire</option>
          </Select>
        </Field>
        <Field label="N° de pièce">
          <Input name="numero_piece" defaultValue={initial?.numero_piece ?? ''} />
        </Field>
      </div>

      <Field label="Adresse">
        <Textarea name="adresse" defaultValue={initial?.adresse ?? ''} />
      </Field>
      <Field label="Notes internes">
        <Textarea name="notes" defaultValue={initial?.notes ?? ''} />
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
