import { requireSuperadmin } from '@/lib/superadmin-auth';
import { SuperadminSidebar } from './superadmin-sidebar';

export default async function SuperadminProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireSuperadmin();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <SuperadminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10 shadow">
          <div className="flex items-center gap-2 text-white">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Mode super admin</span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400">Accès complet à tous les hôtels du SaaS</span>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
