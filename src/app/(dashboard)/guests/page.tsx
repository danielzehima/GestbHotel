import Link from 'next/link';
import { Users, Plus } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { GuestSearch } from './guest-search';

export const metadata = { title: 'Clients — GestHotel' };

type SearchParams = { q?: string };

export default async function GuestsPage(props: { searchParams: Promise<SearchParams> }) {
  const user = await requireRole(['admin', 'receptionniste']);
  const { q } = await props.searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('guests')
    .select('id, nom, prenom, email, telephone, nationalite, created_at')
    .eq('hotel_id', user.profile.hotel_id!)
    .order('nom')
    .limit(200);

  if (q && q.length > 1) {
    query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,email.ilike.%${q}%,telephone.ilike.%${q}%`);
  }

  const { data: guests } = await query;

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Base clients de votre hôtel."
        actions={
          <Link href="/guests/new">
            <Button>
              <Plus className="w-4 h-4" />
              Nouveau client
            </Button>
          </Link>
        }
      />

      <GuestSearch initialQuery={q ?? ''} />

      {!guests || guests.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? 'Aucun résultat' : 'Aucun client enregistré'}
          description={q ? 'Essayez une autre recherche.' : 'Les clients seront ajoutés via les réservations ou ici manuellement.'}
          action={
            !q && (
              <Link href="/guests/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Ajouter un client
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Nom</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Téléphone</th>
                <th className="text-left px-4 py-3">Nationalité</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guests.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{g.prenom} {g.nom}</td>
                  <td className="px-4 py-3 text-slate-600">{g.email ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{g.telephone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{g.nationalite ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/guests/${g.id}/edit`}
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
