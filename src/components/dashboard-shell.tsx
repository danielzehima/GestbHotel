'use client';

import { useState } from 'react';
import { Menu, Hotel } from 'lucide-react';
import { Sidebar } from './sidebar';
import { RoleBadge } from './ui/role-badge';
import type { UserRole } from '@/types/database';

export function DashboardShell({
  role,
  user,
  children
}: {
  role: UserRole;
  user: { nom: string; prenom: string; email: string };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 print:bg-white print:min-h-0 print:block">
      <div className="print:hidden">
        <Sidebar
          role={role}
          user={user}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 print:block">
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 gap-2 print:hidden">
          {/* Hamburger mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo compact sur mobile uniquement (la sidebar a son propre logo) */}
          <div className="md:hidden flex items-center gap-1.5">
            <Hotel className="w-5 h-5 text-brand-600" />
            <span className="text-base font-bold text-slate-900">GestHotel</span>
          </div>

          {/* Info desktop */}
          <h2 className="hidden md:block text-sm text-slate-500">
            Connecté en tant que{' '}
            <span className="font-medium text-slate-900">
              {user.prenom} {user.nom}
            </span>
          </h2>

          <div className="ml-auto md:ml-0">
            <RoleBadge role={role} />
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 min-w-0 print:p-0 print:space-y-0">
          {children}
        </main>
      </div>
    </div>
  );
}
