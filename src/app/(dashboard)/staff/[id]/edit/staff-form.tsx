'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { updateStaff } from '../../actions';
import type { UserRole } from '@/types/database';

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  receptionniste: 'Réceptionniste',
  menage: 'Ménage',
  serveur: 'Serveur',
  cuisine: 'Cuisine',
  comptable: 'Comptable'
};

type Staff = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  role: UserRole;
  actif: boolean;
};

export function StaffForm({ initial, isSelf }: { initial: Staff; isSelf: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await updateStaff(initial.id, fd);
      if (r.ok) {
        toast.success('Profil mis à jour');
        router.push('/staff');
      } else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom" required>
          <Input name="prenom" defaultValue={initial.prenom} required maxLength={100} />
        </Field>
        <Field label="Nom" required>
          <Input name="nom" defaultValue={initial.nom} required maxLength={100} />
        </Field>
      </div>

      <Field label="Téléphone">
        <Input name="telephone" defaultValue={initial.telephone ?? ''} />
      </Field>

      <Field label="Rôle" required hint={isSelf ? 'Vous modifiez votre propre profil — attention à ne pas perdre vos droits admin.' : undefined}>
        <Select name="role" defaultValue={initial.role} required>
          {(['admin', 'receptionniste', 'menage', 'serveur', 'cuisine', 'comptable'] as UserRole[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Compte actif">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="actif" defaultChecked={initial.actif} value="true" className="rounded" />
          <span>Le compte peut se connecter</span>
        </label>
      </Field>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
