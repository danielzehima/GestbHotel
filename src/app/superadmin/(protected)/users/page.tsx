import { Users } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/page-header';
import { formatDateTime } from '@/lib/utils/format';
import { RoleBadge } from '@/components/ui/role-badge';
import { UserActions } from './user-actions';

export const metadata = { title: 'Utilisateurs — Super Admin' };

export default async function SuperadminUsersPage() {
  const supabase = createAdminClient();

  const { data: users } = await supabase
    .from('profiles')
    .select('id, nom, prenom, role, actif, derniere_connexion, created_at, hotel:hotels(nom, slug)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Tous les utilisateurs"
        description="Profils inscrits sur la plateforme, toutes hôtels confondus."
      />

      {(!users || users.length === 0) ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500">Aucun utilisateur.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Utilisateur</th>
                <th className="text-left px-4 py-3">Hôtel</th>
                <th className="text-left px-4 py-3">Rôle</th>
                <th className="text-left px-4 py-3">Dernière connexion</th>
                <th className="text-center px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{u.prenom} {u.nom}</div>
                    <div className="text-xs text-slate-400 font-mono">{u.id.slice(0, 8)}…</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {u.hotel?.nom ?? <span className="text-slate-400 italic">non rattaché</span>}
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {u.derniere_connexion ? formatDateTime(u.derniere_connexion) : 'Jamais'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.actif ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">ACTIF</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">DÉSACTIVÉ</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserActions id={u.id} actif={u.actif} role={u.role} nom={`${u.prenom} ${u.nom}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
