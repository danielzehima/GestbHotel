import { Users, Eye } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/page-header';
import { formatDateTime } from '@/lib/utils/format';
import { RoleBadge } from '@/components/ui/role-badge';

export const metadata = { title: 'Utilisateurs — Super Admin' };
export const dynamic = 'force-dynamic';

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

      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 mb-4 flex items-start gap-2 text-sm text-slate-700">
        <Eye className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong>Lecture seule.</strong> Les rôles et l'activation des comptes sont gérés par les administrateurs de chaque hôtel depuis leur propre interface <code className="bg-white px-1 py-0.5 rounded text-xs">/staff</code>.
        </div>
      </div>

      {(!users || users.length === 0) ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500">Aucun utilisateur.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Utilisateur</th>
                <th className="text-left px-4 py-3">Hôtel</th>
                <th className="text-left px-4 py-3">Rôle</th>
                <th className="text-left px-4 py-3">Inscription</th>
                <th className="text-left px-4 py-3">Dernière connexion</th>
                <th className="text-center px-4 py-3">Statut</th>
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
                    {u.created_at ? formatDateTime(u.created_at) : '—'}
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
