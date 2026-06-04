import { requireUser } from '@/lib/auth';
import { Sidebar } from '@/components/sidebar';
import { RoleBadge } from '@/components/ui/role-badge';
import { TrialBanner } from '@/components/trial-banner';
import { createClient } from '@/lib/supabase/server';
import { getPlanStatus } from '@/lib/plan';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // Statut du plan / essai de l'hôtel courant
  let planStatus = null;
  if (user.profile.hotel_id) {
    const supabase = await createClient();
    const { data: hotel } = await supabase
      .from('hotels')
      .select('plan, plan_expires_at, created_at')
      .eq('id', user.profile.hotel_id)
      .single();
    if (hotel) planStatus = getPlanStatus(hotel as any);
  }

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

        <main className="flex-1 p-6 space-y-6">
          {planStatus && <TrialBanner status={planStatus} />}
          {children}
        </main>
      </div>
    </div>
  );
}
