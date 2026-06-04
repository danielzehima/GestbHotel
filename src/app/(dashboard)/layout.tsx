import { requireUser } from '@/lib/auth';
import { Sidebar } from '@/components/sidebar';
import { RoleBadge } from '@/components/ui/role-badge';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        role={user.profile.role}
        user={{ nom: user.profile.nom, prenom: user.profile.prenom, email: user.email }}
      />

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 className="text-sm text-slate-500">
            Connecté en tant que{' '}
            <span className="font-medium text-slate-900">
              {user.profile.prenom} {user.profile.nom}
            </span>
          </h2>
          <RoleBadge role={user.profile.role} />
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
