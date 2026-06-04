import Link from 'next/link';
import { Users } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { RoleBadge } from '@/components/ui/role-badge';
import { formatDateTime } from '@/lib/utils/format';

export const metadata = { title: 'Personnel — GestHotel' };

export default async function StaffPage() {
  const user = await requireRole(['admin']);
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from('profiles')
    .select('id, nom, prenom, telephone, role, actif, derniere_connexion')
    .eq('hotel_id', user.profile.hotel_id!)
    .order('nom');

  return (
    <div>
      <PageHeader
        title="Personnel"
        description="Membres de l'équipe rattachés à votre hôtel."
      />

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-900">
        <strong>Inviter un nouvel employé :</strong> demandez-lui de créer son compte sur la page de connexion (un compte sera créé automatiquement), puis modifiez ici son rôle.
        <br />
        Sinon, créez-le manuellement depuis le dashboard Supabase &gt; Authentication &gt; Add user.
      </div>

      {!staff || staff.length === 0 ? (
        <EmptyState icon={Users} title="Aucun membre" description="Aucun profil rattaché." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Nom</th>
                <th className="text-left px-4 py-3">Téléphone</th>
                <th className="text-left px-4 py-3">Rôle</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="text-left px-4 py-3">Dernière connexion</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.prenom} {s.nom}</td>
                  <td className="px-4 py-3 text-slate-600">{s.telephone ?? '—'}</td>
                  <td className="px-4 py-3"><RoleBadge role={s.role} /></td>
                  <td className="px-4 py-3">
                    {s.actif ? (
                      <span className="text-emerald-600 text-xs font-medium">● Actif</span>
                    ) : (
                      <span className="text-slate-400 text-xs">● Inactif</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {s.derniere_connexion ? formatDateTime(s.derniere_connexion) : 'Jamais'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/staff/${s.id}/edit`}
                      className="text-brand-600 hover:underline text-xs font-medium"
                    >
                      Modifier
                    </Link>
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
