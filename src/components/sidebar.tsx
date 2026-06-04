'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  CalendarClock,
  Clock,
  Users,
  UserCircle,
  Sparkles,
  UtensilsCrossed,
  Receipt,
  Settings,
  LogOut,
  Hotel
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { logoutAction } from '@/app/(auth)/login/actions';
import type { UserRole } from '@/types/database';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
};

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard,
    roles: ['admin','receptionniste','menage','serveur','cuisine','comptable','super_admin'] },
  { href: '/rooms', label: 'Chambres', icon: BedDouble,
    roles: ['admin','receptionniste','menage'] },
  { href: '/reservations', label: 'Réservations', icon: CalendarDays,
    roles: ['admin','receptionniste'] },
  { href: '/guests', label: 'Clients', icon: UserCircle,
    roles: ['admin','receptionniste'] },
  { href: '/housekeeping', label: 'Ménage', icon: Sparkles,
    roles: ['admin','receptionniste','menage'] },
  { href: '/shifts', label: 'Plannings', icon: CalendarClock,
    roles: ['admin','receptionniste','menage','serveur','cuisine'] },
  { href: '/clock', label: 'Mon pointage', icon: Clock,
    roles: ['admin','receptionniste','menage','serveur','cuisine','comptable'] },
  { href: '/restaurant', label: 'Restaurant', icon: UtensilsCrossed,
    roles: ['admin','serveur','cuisine','receptionniste'] },
  { href: '/invoices', label: 'Facturation', icon: Receipt,
    roles: ['admin','receptionniste','comptable'] },
  { href: '/staff', label: 'Personnel', icon: Users,
    roles: ['admin'] },
  { href: '/settings', label: 'Paramètres', icon: Settings,
    roles: ['admin','receptionniste','menage','serveur','cuisine','comptable','super_admin'] }
];

export function Sidebar({
  role,
  user
}: {
  role: UserRole;
  user: { nom: string; prenom: string; email: string };
}) {
  const pathname = usePathname();
  const items = NAV.filter((i) => i.roles.includes(role));

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-100">
        <Hotel className="w-6 h-6 text-brand-600" />
        <span className="text-lg font-bold text-slate-900">GestHotel</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4 space-y-3">
        <div>
          <div className="text-sm font-medium text-slate-900">
            {user.prenom} {user.nom}
          </div>
          <div className="text-xs text-slate-500 truncate">{user.email}</div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 transition"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}
