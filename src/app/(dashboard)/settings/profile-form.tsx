'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { updateMyProfile } from './actions';

export function ProfileForm({
  initial
}: {
  initial: { nom: string; prenom: string; telephone: string; email: string };
}) {
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await updateMyProfile(fd);
      if (r.ok) toast.success('Profil mis à jour');
      else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email" hint="Non modifiable depuis ici">
        <Input value={initial.email} disabled />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom" required>
          <Input name="prenom" defaultValue={initial.prenom} required maxLength={100} />
        </Field>
        <Field label="Nom" required>
          <Input name="nom" defaultValue={initial.nom} required maxLength={100} />
        </Field>
      </div>

      <Field label="Téléphone">
        <Input name="telephone" defaultValue={initial.telephone} />
      </Field>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
