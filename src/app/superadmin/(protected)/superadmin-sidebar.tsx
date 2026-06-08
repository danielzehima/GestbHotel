'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard, Hotel, Users, Mail, LogOut, ShieldCheck, ArrowLeftCircle, CreditCard, X
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { superadminLogout } from '../actions';

const NAV = [
  { href: '/superadmin', label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: '/superadmin/hotels', label: 'Hôtels', icon: Hotel },
  { href: '/superadmin/users', label: 'Utilisateurs', icon: Users },
  { href: '/superadmin/plans', label: 'Tarifs', icon: CreditCard },
  { href: '/superadmin/messages', label: 'Messages contact', icon: Mail }
];

export function SuperadminSidebar({
  mobileOpen,
  onMobileClose
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();

  // Ferme le drawer au changement de route
  useEffect(() => {
    if (mobileOpen) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Bloque le scroll du body quand le drawer est ouvert
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
          className="md:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'flex flex-col w-64 bg-slate-900 text-slate-300',
          // Desktop : statique, sticky
          'md:flex md:h-screen md:sticky md:top-0',
          // Mobile : drawer slide-in
          'fixed md:static inset-y-0 left-0 z-50 h-screen h-[100dvh] max-w-[80vw]',
          'transition-transform duration-300 ease-out shadow-2xl md:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="h-14 flex items-center justify-between gap-2 px-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </span>
            <span className="text-base font-bold text-white">Super Admin</span>
          </div>
          {/* Fermeture mobile */}
          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden p-2 -mr-2 text-slate-400 hover:text-white"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                  active
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4 space-y-2 shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <ArrowLeftCircle className="w-4 h-4" />
            Retour app
          </Link>
          <form action={superadminLogout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
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
