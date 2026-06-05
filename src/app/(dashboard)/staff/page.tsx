import Link from 'next/link';
import { Users, UserPlus, Info } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { RoleBadge } from '@/components/ui/role-badge';
import { formatDateTime } from '@/lib/utils/format';
import { ROLE_DEFINITIONS } from './role-permissions';
import { MemberActions } from './member-actions';

export const metadata = { title: 'Personnel — GestHotel' };

export default async function StaffPage() {
  const user = await requireRole(['admin']);

  if (!user.profile.hotel_id) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-amber-50 border border-amber-200 rounded-xl">
        <h2 className="font-semibold text-amber-900 mb-2">Compte non rattaché</h2>
        <p className="text-sm text-amber-800">
          Votre compte n'est associé à aucun hôtel.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: staffRaw, error } = await supabase
    .from('profiles')
    .select('id, nom, prenom, telephone, role, actif, derniere_connexion')
    .eq('hotel_id', user.profile.hotel_id)
    .order('nom');

  if (error) {
    throw new Error(`Impossible de charger l'équipe : ${error.message}`);
  }

  // Filtre défensif : exclut tout profil malformé (sans rôle valide)
  const validRoles = ['admin', 'receptionniste', 'menage', 'serveur', 'cuisine', 'comptable', 'super_admin'];
  const staff = (staffRaw ?? []).filter((s: any) => s && s.id && validRoles.includes(s.role));

  return (
    <div>
      <PageHeader
        title="Personnel"
        description="Invitez votre équipe et attribuez les bons droits d'accès."
        actions={
          <Link href="/staff/new">
            <Button>
              <UserPlus className="w-4 h-4" />
              Inviter un membre
            </Button>
          </Link>
        }
      />

      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4 flex items-start gap-3 text-sm text-brand-900">
        <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <strong>Comment ajouter un employé :</strong> cliquez sur <strong>"Inviter un membre"</strong>, remplissez ses informations et choisissez son rôle. GestHotel génère un mot de passe sécurisé que vous pouvez partager par WhatsApp ou email. L'employé pourra le modifier après sa première connexion dans <em>Paramètres</em>.
        </div>
      </div>

      {!staff || staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Vous n'avez pas encore d'équipe"
          description="Invitez votre premier collaborateur en quelques secondes."
          action={
            <Link href="/staff/new">
              <Button>
                <UserPlus className="w-4 h-4" />
                Inviter un membre
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
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
              {staff.map((s: any) => (
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
                    <div className="flex justify-end items-center gap-2">
                      <Link
                        href={`/staff/${s.id}/edit`}
                        className="text-brand-600 hover:underline text-xs font-medium"
                      >
                        Modifier
                      </Link>
                      <MemberActions
                        id={s.id}
                        nom={`${s.prenom} ${s.nom}`}
                        isSelf={s.id === user.profile.id}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Matrice des rôles */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-900 mb-1">Droits d'accès par rôle</h2>
        <p className="text-sm text-slate-500 mb-5">
          Référence des permissions automatiquement accordées selon le rôle attribué à un membre.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => (
            <div key={key} className="border border-slate-200 rounded-xl p-4 hover:border-brand-300 transition">
              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded border ${def.color}`}>
                {def.label}
              </span>
              <p className="text-xs text-slate-500 mt-2 mb-3">{def.short}</p>
              <ul className="space-y-1.5">
                {def.permissions.map((p) => (
                  <li key={p.label} className="text-xs">
                    <div className="font-medium text-slate-900">• {p.label}</div>
                    <div className="text-slate-500 ml-2">{p.desc}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
