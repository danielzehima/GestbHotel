import { TrendingUp, BedDouble, DollarSign, Percent, CalendarCheck, LogIn, LogOut, Moon } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { computeAnalytics } from '@/lib/analytics';
import { getHotelPlanLimits } from '@/lib/plan-limits';
import { cn } from '@/lib/utils/cn';
import { ExportButtons } from './export-buttons';

export const metadata = { title: 'Rapports — GestHotel' };
export const dynamic = 'force-dynamic';

type SearchParams = { preset?: string; from?: string; to?: string };

function iso(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(s: string, n: number) { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); }

const PRESETS = [
  { value: 'this_month', label: 'Ce mois-ci' },
  { value: 'last_month', label: 'Mois dernier' },
  { value: 'last_30', label: '30 derniers jours' },
  { value: 'this_year', label: 'Cette année' }
];

function resolvePeriod(sp: SearchParams): { from: string; to: string; label: string } {
  const now = new Date();
  if (sp.from && sp.to) {
    return { from: sp.from, to: addDays(sp.to, 1), label: 'Personnalisée' };
  }
  const preset = sp.preset || 'this_month';
  if (preset === 'last_month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: iso(from), to: iso(to), label: 'Mois dernier' };
  }
  if (preset === 'last_30') {
    return { from: addDays(iso(now), -29), to: addDays(iso(now), 1), label: '30 derniers jours' };
  }
  if (preset === 'this_year') {
    return { from: iso(new Date(now.getFullYear(), 0, 1)), to: iso(new Date(now.getFullYear() + 1, 0, 1)), label: 'Cette année' };
  }
  // this_month
  return {
    from: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
    label: 'Ce mois-ci'
  };
}

export default async function ReportsPage(props: { searchParams: Promise<SearchParams> }) {
  const user = await requireRole(['admin', 'comptable']);
  const sp = await props.searchParams;
  const { from, to, label } = resolvePeriod(sp);

  const supabase = await createClient();
  const { data: hotelRow } = await supabase
    .from('hotels').select('nom').eq('id', user.profile.hotel_id!).maybeSingle();
  const hotelNom = (hotelRow as any)?.nom ?? '';

  const a = await computeAnalytics(user.profile.hotel_id!, from, to);
  const { limits } = await getHotelPlanLimits(user.profile.hotel_id!);
  const m = (n: number) => formatMoney(Math.round(n), a.devise);
  const activePreset = !sp.from && (sp.preset || 'this_month');

  return (
    <div>
      <PageHeader
        title="Rapports & analytics"
        description={`Période : ${formatDate(from)} → ${formatDate(addDays(to, -1))} (${label})`}
        actions={<ExportButtons data={a} hotelNom={hotelNom} canExport={limits.exports} />}
      />

      {/* Sélecteur de période */}
      <div className="flex flex-wrap items-center gap-2 mb-5 print:hidden">
        {PRESETS.map((p) => (
          <a
            key={p.value}
            href={`/reports?preset=${p.value}`}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition',
              activePreset === p.value
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            {p.label}
          </a>
        ))}
        <form method="get" className="flex items-center gap-2 ml-auto">
          <input type="date" name="from" defaultValue={sp.from ?? from}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
          <span className="text-slate-400 text-sm">→</span>
          <input type="date" name="to" defaultValue={sp.to ?? addDays(to, -1)}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
          <button type="submit" className="bg-slate-800 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-900">
            Appliquer
          </button>
        </form>
      </div>

      {/* KPI principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Kpi icon={Percent} color="brand" label="Taux d'occupation" value={`${a.occupancyPct.toFixed(1)} %`}
          hint={`${a.soldRoomNights} / ${a.availableRoomNights} nuitées`} />
        <Kpi icon={DollarSign} color="emerald" label="Revenu chambres" value={m(a.roomRevenue)}
          hint={`${a.bookings} réservation${a.bookings > 1 ? 's' : ''}`} />
        <Kpi icon={TrendingUp} color="indigo" label="ADR (prix moyen/nuit)" value={m(a.adr)}
          hint="Revenu / nuitées vendues" />
        <Kpi icon={BedDouble} color="amber" label="RevPAR" value={m(a.revpar)}
          hint="Revenu / nuitées dispo" />
      </div>

      {/* KPI secondaires */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Mini icon={Moon} label="Nuitées vendues" value={a.soldRoomNights} />
        <Mini icon={CalendarCheck} label="Chambres actives" value={a.roomsCount} />
        <Mini icon={LogIn} label="Arrivées" value={a.arrivals} />
        <Mini icon={LogOut} label="Départs" value={a.departures} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenu par source */}
        <Card title="Revenu par source">
          {a.revenueBySource.length === 0 ? <Empty /> : (
            <Table head={['Source', 'Réservations', 'Revenu']}>
              {a.revenueBySource.map((s) => (
                <tr key={s.source} className="border-t border-slate-100">
                  <td className="px-4 py-2 capitalize">{s.source}</td>
                  <td className="px-4 py-2 text-center">{s.bookings}</td>
                  <td className="px-4 py-2 text-right font-medium">{m(s.revenue)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        {/* Par type de chambre */}
        <Card title="Performance par type de chambre">
          {a.byRoomType.length === 0 ? <Empty /> : (
            <Table head={['Type', 'Nuitées', 'Revenu']}>
              {a.byRoomType.map((t) => (
                <tr key={t.libelle} className="border-t border-slate-100">
                  <td className="px-4 py-2">{t.libelle}</td>
                  <td className="px-4 py-2 text-center">{t.soldNights}</td>
                  <td className="px-4 py-2 text-right font-medium">{m(t.revenue)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        Les revenus des séjours à cheval sur la période sont calculés au prorata des nuits. Réservations annulées et no-show exclues.
      </p>
    </div>
  );
}

const COLORS: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  amber: 'bg-amber-50 text-amber-700'
};

function Kpi({ icon: Icon, color, label, value, hint }: {
  icon: React.ComponentType<{ className?: string }>; color: string; label: string; value: string; hint?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2', COLORS[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Mini({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <Icon className="w-5 h-5 text-slate-400" />
      <div>
        <p className="text-lg font-bold text-slate-900">{value}</p>
        <p className="text-[11px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-900">{title}</div>
      {children}
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
        <tr>
          {head.map((h, i) => (
            <th key={h} className={cn('px-4 py-2', i === 0 ? 'text-left' : i === head.length - 1 ? 'text-right' : 'text-center')}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Empty() {
  return <p className="px-4 py-8 text-center text-sm text-slate-400">Aucune donnée sur cette période.</p>;
}
