'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Hotel, Users, Mail, LogOut, ShieldCheck, ArrowLeftCircle
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { superadminLogout } from '../actions';

const NAV = [
  { href: '/superadmin', label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: '/superadmin/hotels', label: 'Hôtels', icon: Hotel },
  { href: '/superadmin/users', label: 'Utilisateurs', icon: Users },
  { href: '/superadmin/messages', label: 'Messages contact', icon: Mail }
];

export function SuperadminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 h-screen sticky top-0">
      <div className="h-14 flex items-center gap-2 px-5 border-b border-slate-800">
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-white" />
        </span>
        <span className="text-base font-bold text-white">Super Admin</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                active
                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4 space-y-2">
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
  );
}
