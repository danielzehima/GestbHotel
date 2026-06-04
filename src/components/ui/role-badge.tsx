import { cn } from '@/lib/utils/cn';
import type { UserRole } from '@/types/database';

const labels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  receptionniste: 'Réception',
  menage: 'Ménage',
  serveur: 'Serveur',
  cuisine: 'Cuisine',
  comptable: 'Comptable'
};

const colors: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-brand-100 text-brand-700',
  receptionniste: 'bg-emerald-100 text-emerald-700',
  menage: 'bg-amber-100 text-amber-700',
  serveur: 'bg-pink-100 text-pink-700',
  cuisine: 'bg-orange-100 text-orange-700',
  comptable: 'bg-slate-200 text-slate-700'
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium', colors[role])}>
      {labels[role]}
    </span>
  );
}
