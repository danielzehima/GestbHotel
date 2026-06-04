'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Power, Loader2 } from 'lucide-react';
import { toggleUserActive, changeUserRole } from '../../actions';

const ROLES = [
  { v: 'super_admin', l: 'Super Admin' },
  { v: 'admin', l: 'Administrateur' },
  { v: 'receptionniste', l: 'Réception' },
  { v: 'menage', l: 'Ménage' },
  { v: 'serveur', l: 'Serveur' },
  { v: 'cuisine', l: 'Cuisine' },
  { v: 'comptable', l: 'Comptable' }
];

export function UserActions({
  id,
  actif,
  role,
  nom
}: {
  id: string;
  actif: boolean;
  role: string;
  nom: string;
}) {
  const [pending, start] = useTransition();

  function onToggle() {
    start(async () => {
      const r = await toggleUserActive(id, !actif);
      if (r.ok) toast.success(actif ? `${nom} désactivé` : `${nom} réactivé`);
      else toast.error(r.error);
    });
  }

  function onRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    start(async () => {
      const r = await changeUserRole(id, next);
      if (r.ok) toast.success('Rôle changé');
      else toast.error(r.error);
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <select
        value={role}
        onChange={onRoleChange}
        disabled={pending}
        className="text-xs px-2 py-1 rounded border border-slate-200 bg-slate-50"
      >
        {ROLES.map((r) => (
          <option key={r.v} value={r.v}>{r.l}</option>
        ))}
      </select>
      <button
        onClick={onToggle}
        disabled={pending}
        title={actif ? 'Désactiver' : 'Réactiver'}
        className={`p-1.5 rounded ${actif ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
      </button>
    </div>
  );
}
