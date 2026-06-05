import Link from 'next/link';
import { AlertTriangle, LogOut } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getAuthState } from '@/lib/auth';
import { TrialBanner } from '@/components/trial-banner';
import { DashboardShell } from '@/components/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { getPlanStatus } from '@/lib/plan';
import { logoutAction } from '@/app/(auth)/login/actions';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const state = await getAuthState();

  if (state.kind === 'anonymous') redirect('/login');

  if (state.kind === 'no_profile') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-xl w-full bg-white border-2 border-amber-300 rounded-2xl p-6 shadow">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Profil utilisateur introuvable</h1>
              <p className="text-sm text-slate-600 mt-1">
                Votre compte d'authentification existe (<strong>{state.email}</strong>) mais aucun profil n'est associé en base.
              </p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm text-amber-900">
            <strong>Solution rapide :</strong> demandez à l'administrateur SaaS d'exécuter ce SQL :
            <pre className="bg-white border border-amber-100 rounded p-2 mt-2 text-xs font-mono overflow-x-auto">
{`insert into profiles (id, nom, prenom, role)
values ('${state.authUserId}', 'À renseigner', 'À renseigner', 'receptionniste'::user_role)
on conflict (id) do nothing;`}
            </pre>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={logoutAction}>
              <button type="submit" className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded">
                <LogOut className="w-4 h-4" /> Se déconnecter
              </button>
            </form>
            <Link href="/" className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded hover:bg-slate-50">
              Retour accueil
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const user = state.user;

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
        planWarning = `Migration manquante (hotels.plan). ${error.message}`;
        console.error('[layout] fetch hotel plan:', error.message);
      } else if (hotel) {
        planStatus = getPlanStatus(hotel as any);
      }
    } catch (e: any) {
      planWarning = `Erreur récup plan : ${e?.message ?? 'inconnue'}`;
      console.error('[layout] plan threw:', e);
    }
  }

  return (
    <DashboardShell
      role={user.profile.role}
      user={{ nom: user.profile.nom, prenom: user.profile.prenom, email: user.email }}
    >
      {planWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 print:hidden">
          ⚠ {planWarning}
        </div>
      )}
      {planStatus && (
        <div className="print:hidden">
          <TrialBanner status={planStatus} />
        </div>
      )}
      {children}
    </DashboardShell>
  );
}
