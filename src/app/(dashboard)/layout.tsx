import { requireUser } from '@/lib/auth';
import { Sidebar } from '@/components/sidebar';
import { RoleBadge } from '@/components/ui/role-badge';
import { TrialBanner } from '@/components/trial-banner';
import { createClient } from '@/lib/supabase/server';
import { getPlanStatus } from '@/lib/plan';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // Récup plan — totalement défensif, ne doit JAMAIS faire planter le layout
  let planStatus: any = null;
  let planWarning: string | null = null;

  if (user.profile.hotel_id) {
    try {
      const supabase = await createClient();
      const { data: hotel, error } = await supabase
        .from('hotels')
        .select('plan, plan_expires_at, created_at')
        .eq('id', user.profile.hotel_id)
        .maybeSingle();

      if (error) {
        // Migration plan/plan_expires_at probablement non exécutée
        planWarning = `Migration manquante (hotels.plan / plan_expires_at). Détail : ${error.message}`;
        console.error('[layout] fetch hotel plan failed:', error.message);
      } else if (hotel) {
        planStatus = getPlanStatus(hotel as any);
      }
    } catch (e: any) {
      planWarning = `Erreur récup plan : ${e?.message ?? 'inconnue'}`;
      console.error('[layout] plan fetch threw:', e);
    }
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
          {planWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
              ⚠ {planWarning}
            </div>
          )}
          {planStatus && <TrialBanner status={planStatus} />}
          {children}
        </main>
      </div>
    </div>
  );
}
