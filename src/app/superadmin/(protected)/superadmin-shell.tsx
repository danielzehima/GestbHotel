'use client';

import { useState } from 'react';
import { Menu, ShieldCheck } from 'lucide-react';
import { SuperadminSidebar } from './superadmin-sidebar';

export function SuperadminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <SuperadminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center gap-2 px-3 sm:px-6 sticky top-0 z-30 shadow">
          {/* Hamburger mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 -ml-1 text-slate-300 hover:bg-slate-800 rounded-lg"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Titre compact mobile */}
          <div className="md:hidden flex items-center gap-1.5 text-white">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-bold">Super Admin</span>
          </div>

          {/* Infos desktop */}
          <div className="hidden md:flex items-center gap-2 text-white">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Mode super admin</span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400">Accès complet à tous les hôtels du SaaS</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
