import { Hotel } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/page-header';
import { formatDateTime, formatMoney } from '@/lib/utils/format';
import { HotelActions } from './hotel-actions';

export const metadata = { title: 'Hôtels — Super Admin' };

export default async function SuperadminHotelsPage() {
  const supabase = createAdminClient();

  const { data: hotels } = await supabase
    .from('hotels')
    .select(`*,
      profiles:profiles(id),
      rooms:rooms(id),
      reservations:reservations(id),
      payments:payments(montant, statut)`)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader title="Tous les hôtels" description="Vue globale et actions admin sur chaque tenant." />

      {(!hotels || hotels.length === 0) ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Hotel className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500">Aucun hôtel inscrit pour le moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Hôtel</th>
                <th className="text-left px-4 py-3">Slug</th>
                <th className="text-left px-4 py-3">Inscription</th>
                <th className="text-right px-4 py-3">Users</th>
                <th className="text-right px-4 py-3">Chambres</th>
                <th className="text-right px-4 py-3">Résa.</th>
                <th className="text-right px-4 py-3">CA encaissé</th>
                <th className="text-center px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hotels.map((h: any) => {
                const revenue = (h.payments ?? [])
                  .filter((p: any) => p.statut === 'reussi')
                  .reduce((s: number, p: any) => s + Number(p.montant ?? 0), 0);
                return (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{h.nom}</div>
                      <div className="text-xs text-slate-500">{h.ville ?? '—'} · {h.pays ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">/{h.slug}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(h.created_at)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{h.profiles?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right font-semibold">{h.rooms?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right font-semibold">{h.reservations?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatMoney(revenue)}</td>
                    <td className="px-4 py-3 text-center">
                      {h.actif ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">ACTIF</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">INACTIF</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <HotelActions id={h.id} actif={h.actif} nom={h.nom} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
