'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
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
  BarChart3,
  Settings,
  LogOut,
  Hotel,
  X,
  Tag,
  Radio
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
  { href: '/reports', label: 'Rapports', icon: BarChart3,
    roles: ['admin','comptable'] },
  { href: '/tarification', label: 'Tarification', icon: Tag,
    roles: ['admin'] },
  { href: '/channels', label: 'Channel Manager', icon: Radio,
    roles: ['admin'] },
  { href: '/staff', label: 'Personnel', icon: Users,
    roles: ['admin'] },
  { href: '/settings', label: 'Paramètres', icon: Settings,
    roles: ['admin','receptionniste','menage','serveur','cuisine','comptable','super_admin'] }
];

export function Sidebar({
  role,
  user,
  mobileOpen,
  onMobileClose
}: {
  role: UserRole;
  user: { nom: string; prenom: string; email: string };
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const items = NAV.filter((i) => i.roles.includes(role));

  // Ferme automatiquement le drawer mobile au changement de route
  useEffect(() => {
    if (mobileOpen) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Empêche le scroll du body quand drawer mobile ouvert
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* Backdrop mobile */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar (drawer sur mobile, statique sur desktop) */}
      <aside
        className={cn(
          'flex flex-col bg-white border-r border-slate-200',
          // Desktop : statique, sticky
          'md:flex md:w-64 md:h-screen md:sticky md:top-0',
          // Mobile : drawer slide-in — h-[100dvh] pour tenir compte de la barre du navigateur mobile
          'fixed md:static inset-y-0 left-0 z-50 w-72 max-w-[80vw] h-screen h-[100dvh]',
          'transition-transform duration-300 ease-out shadow-2xl md:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center justify-between gap-2 px-6 border-b border-slate-100 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Hotel className="w-6 h-6 text-brand-600" />
            <span className="text-lg font-bold text-slate-900">GestHotel</span>
          </Link>
          {/* Bouton fermeture mobile */}
          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4 space-y-3 shrink-0">
          <div>
            <div className="text-sm font-medium text-slate-900 truncate">
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
    </>
  );
}
