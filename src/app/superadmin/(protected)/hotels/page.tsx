import { Hotel } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/page-header';
import { formatDateTime, formatMoney, formatDate } from '@/lib/utils/format';
import { getPlanStatus, PLAN_LABELS, PLAN_COLORS, PLAN_PRICES, type Plan } from '@/lib/plan';
import { HotelActions } from './hotel-actions';
import { PlanActions } from './plan-actions';

export const metadata = { title: 'Hôtels — Super Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = { filter?: 'all' | 'paid' | 'trial' | 'expired' };

export default async function SuperadminHotelsPage(props: { searchParams: Promise<SearchParams> }) {
  const { filter = 'all' } = await props.searchParams;
  const supabase = createAdminClient();

  const { data: hotels } = await supabase
    .from('hotels')
    .select(`*,
      profiles:profiles(id),
      rooms:rooms(id),
      reservations:reservations(id)`)
    .order('created_at', { ascending: false });

  // Décorer avec le statut du plan
  const decorated = (hotels ?? []).map((h: any) => ({ ...h, _status: getPlanStatus(h) }));

  // Filtrer
  const filtered = decorated.filter((h: any) => {
    if (filter === 'paid') return h.plan !== 'trial' && !h._status.isExpired;
    if (filter === 'trial') return h.plan === 'trial' && !h._status.isExpired;
    if (filter === 'expired') return h._status.isExpired;
    return true;
  });

  // Compteurs pour les pills
  const counts = {
    all: decorated.length,
    paid: decorated.filter((h: any) => h.plan !== 'trial' && !h._status.isExpired).length,
    trial: decorated.filter((h: any) => h.plan === 'trial' && !h._status.isExpired).length,
    expired: decorated.filter((h: any) => h._status.isExpired).length
  };

  return (
    <div>
      <PageHeader
        title="Hôtels"
        description="Tous les tenants inscrits sur la plateforme. Données d'abonnement uniquement — pas de revenu hôtelier privé."
      />

      <div className="flex gap-2 mb-4 text-sm">
        <Pill href="/superadmin/hotels" label="Tous" active={filter === 'all'} count={counts.all} />
        <Pill href="/superadmin/hotels?filter=paid" label="Abonnés payants" active={filter === 'paid'} count={counts.paid} tone="brand" />
        <Pill href="/superadmin/hotels?filter=trial" label="Essais actifs" active={filter === 'trial'} count={counts.trial} tone="amber" />
        <Pill href="/superadmin/hotels?filter=expired" label="Expirés" active={filter === 'expired'} count={counts.expired} tone="rose" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Hotel className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500">Aucun hôtel pour ce filtre.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Hôtel</th>
                <th className="text-left px-4 py-3">Inscription</th>
                <th className="text-right px-4 py-3">Users</th>
                <th className="text-right px-4 py-3">Chambres</th>
                <th className="text-right px-4 py-3">Résa.</th>
                <th className="text-center px-4 py-3">Forfait</th>
                <th className="text-left px-4 py-3">Expiration</th>
                <th className="text-right px-4 py-3">Valeur / mois</th>
                <th className="text-center px-4 py-3">État</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((h: any) => {
                const ps = h._status;
                return (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{h.nom}</div>
                      <div className="text-xs text-slate-500 font-mono">/{h.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(h.created_at)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{h.profiles?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right font-semibold">{h.rooms?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right font-semibold">{h.reservations?.length ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${PLAN_COLORS[h.plan as Plan]}`}>
                        {PLAN_LABELS[h.plan as Plan].toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {ps.expiresAt ? (
                        <div>
                          <div className={ps.isExpired ? 'text-red-600 font-semibold' : 'text-slate-700'}>
                            {formatDate(ps.expiresAt)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ps.isExpired
                              ? 'Expiré'
                              : `${ps.daysLeft}j restant${ps.daysLeft > 1 ? 's' : ''}`}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">à vie</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {h.plan !== 'trial' && !ps.isExpired ? (
                        <span className="font-bold text-emerald-600">
                          {formatMoney(PLAN_PRICES[h.plan as Plan])}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ps.isExpired ? (
                        <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">EXPIRÉ</span>
                      ) : h.actif ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">ACTIF</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">SUSPENDU</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <PlanActions id={h.id} nom={h.nom} currentPlan={h.plan ?? 'trial'} />
                        <HotelActions id={h.id} actif={h.actif} nom={h.nom} />
                      </div>
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

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

function Pill({ href, label, active, count, tone }: any) {
  const tones: Record<string, string> = {
    default: 'bg-slate-900 text-white border-slate-900',
    brand: 'bg-brand-600 text-white border-brand-600',
    amber: 'bg-amber-600 text-white border-amber-600',
    rose: 'bg-rose-600 text-white border-rose-600'
  };
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium border transition',
        active ? tones[tone ?? 'default'] : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      )}
    >
      {label}
      <span className={cn(
        'text-[10px] font-bold px-1.5 py-0.5 rounded',
        active ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
      )}>
        {count}
      </span>
    </Link>
  );
}
