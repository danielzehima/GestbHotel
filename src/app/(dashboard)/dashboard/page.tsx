import Link from 'next/link';
import {
  BedDouble, CalendarCheck, Receipt, Sparkles, TrendingUp, Users,
  UtensilsCrossed, ArrowRight, LogIn, LogOut, Clock, AlertTriangle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { RoomStatusBadge } from '@/components/ui/room-status-badge';
import { ReservationStatusBadge } from '@/components/ui/reservation-status-badge';
import type { RoomStatus } from '@/types/database';

export const metadata = { title: 'Tableau de bord — GestHotel' };
export const dynamic = 'force-dynamic';

function startOfDay(d: Date) { d.setHours(0,0,0,0); return d; }
function isoDay(d: Date) { return d.toISOString().slice(0,10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

const ROOM_COLORS: Record<RoomStatus, string> = {
  disponible: 'bg-emerald-500', occupee: 'bg-brand-500',
  nettoyage: 'bg-amber-500', maintenance: 'bg-orange-500', hors_service: 'bg-slate-400'
};

const PAY_LABELS: Record<string, string> = {
  especes: 'Espèces', carte: 'Carte', wave: 'Wave',
  orange_money: 'Orange Money', mtn_money: 'MTN Money',
  moov_money: 'Moov Money', virement: 'Virement', cinetpay: 'CinetPay'
};

const PAY_COLORS: Record<string, string> = {
  especes: 'bg-emerald-500', carte: 'bg-slate-500', wave: 'bg-sky-500',
  orange_money: 'bg-orange-500', mtn_money: 'bg-yellow-500',
  moov_money: 'bg-blue-500', virement: 'bg-purple-500', cinetpay: 'bg-pink-500'
};

async function fetchDashboardData(hotelId: string) {
  const supabase = await createClient();
  const today = isoDay(new Date());
  const weekAgo = isoDay(addDays(new Date(), -6));
  const monthStart = isoDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const todayStart = startOfDay(new Date()).toISOString();

  const [rooms, arrivals, departures, paymentsToday, paymentsMonth, paymentsWeek, tasksOpen, ordersToday, upcomingReservations, recentActivity, inHouse] = await Promise.all([
    supabase.from('rooms').select('id, statut, room_type:room_types(prix_nuit)').eq('hotel_id', hotelId),
    supabase.from('reservations').select('id, reference, date_arrivee, statut, guest:guests(nom, prenom), room:rooms(numero)').eq('hotel_id', hotelId).eq('date_arrivee', today).in('statut', ['confirmee', 'check_in']),
    supabase.from('reservations').select('id, reference, date_depart, statut, guest:guests(nom, prenom), room:rooms(numero)').eq('hotel_id', hotelId).eq('date_depart', today).in('statut', ['check_in', 'check_out']),
    supabase.from('payments').select('montant, methode').eq('hotel_id', hotelId).eq('statut', 'reussi').gte('encaisse_at', todayStart),
    supabase.from('payments').select('montant').eq('hotel_id', hotelId).eq('statut', 'reussi').gte('encaisse_at', monthStart),
    supabase.from('payments').select('montant, encaisse_at, methode').eq('hotel_id', hotelId).eq('statut', 'reussi').gte('encaisse_at', weekAgo),
    supabase.from('housekeeping_tasks').select('id, statut').eq('hotel_id', hotelId).in('statut', ['a_faire', 'en_cours']),
    supabase.from('orders').select('id, total, statut').eq('hotel_id', hotelId).gte('created_at', todayStart),
    supabase.from('reservations').select('id, reference, date_arrivee, prix_total, guest:guests(nom, prenom), room:rooms(numero)').eq('hotel_id', hotelId).gte('date_arrivee', today).eq('statut', 'confirmee').order('date_arrivee').limit(5),
    supabase.from('reservations').select('id, reference, statut, created_at, guest:guests(nom, prenom)').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(6),
    supabase.from('reservations').select('id, reference, prix_total, date_depart, guest:guests(nom, prenom), room:rooms(numero)').eq('hotel_id', hotelId).eq('statut', 'check_in').order('date_depart').limit(5)
  ]);

  const allRooms = rooms.data ?? [];
  const totalRooms = allRooms.length;
  const occupied = allRooms.filter((r: any) => r.statut === 'occupee').length;
  const occupancy = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

  const statusCounts: Record<RoomStatus, number> = { disponible: 0, occupee: 0, nettoyage: 0, maintenance: 0, hors_service: 0 };
  allRooms.forEach((r: any) => { if (r?.statut && r.statut in statusCounts) statusCounts[r.statut as RoomStatus]++; });

  const revenueToday = (paymentsToday.data ?? []).reduce((s, p: any) => s + Number(p?.montant ?? 0), 0);
  const revenueMonth = (paymentsMonth.data ?? []).reduce((s, p: any) => s + Number(p?.montant ?? 0), 0);
  const revenueWeek = (paymentsWeek.data ?? []).reduce((s, p: any) => s + Number(p?.montant ?? 0), 0);

  const occupiedPrices = allRooms.filter((r: any) => r?.statut === 'occupee' && r?.room_type?.prix_nuit != null).map((r: any) => Number(r.room_type.prix_nuit));
  const adr = occupiedPrices.length > 0 ? Math.round(occupiedPrices.reduce((a, b) => a + b, 0) / occupiedPrices.length) : 0;
  const revpar = totalRooms > 0 ? Math.round(revenueToday / totalRooms) : 0;

  const payByMethod = new Map<string, number>();
  (paymentsWeek.data ?? []).forEach((p: any) => {
    if (!p?.methode) return;
    const cur = payByMethod.get(p.methode) ?? 0;
    payByMethod.set(p.methode, cur + Number(p.montant ?? 0));
  });
  const totalPay = Array.from(payByMethod.values()).reduce((a, b) => a + b, 0);

  const last7Days: { day: string; iso: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(new Date(), -i);
    const iso = isoDay(d);
    const dayLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(d);
    const revenue = (paymentsWeek.data ?? [])
      .filter((p: any) => typeof p?.encaisse_at === 'string' && p.encaisse_at.slice(0, 10) === iso)
      .reduce((s, p: any) => s + Number(p?.montant ?? 0), 0);
    last7Days.push({ day: dayLabel, iso, revenue });
  }
  const maxRev = Math.max(...last7Days.map((d) => d.revenue), 1);

  const orders = ordersToday.data ?? [];
  const ordersCount = orders.length;
  const ordersRevenue = orders.reduce((s: number, o: any) => s + Number(o?.total ?? 0), 0);
  const ordersPending = orders.filter((o: any) => ['nouvelle', 'en_preparation'].includes(o?.statut)).length;

  return {
    totalRooms, occupied, occupancy, statusCounts,
    arrivals: arrivals.data ?? [], departures: departures.data ?? [],
    revenueToday, revenueMonth, revenueWeek, adr, revpar,
    tasksOpen: (tasksOpen.data ?? []).length,
    ordersCount, ordersRevenue, ordersPending,
    upcomingReservations: upcomingReservations.data ?? [],
    recentActivity: recentActivity.data ?? [],
    inHouse: inHouse.data ?? [],
    payByMethod: Array.from(payByMethod.entries()).map(([m, v]) => ({ methode: m, total: v, pct: totalPay > 0 ? (v / totalPay) * 100 : 0 })),
    last7Days, maxRev
  };
}

// ============================================================================
// Wrapper protégé : capture TOUTE erreur et l'affiche en clair (bypass error.tsx)
// ============================================================================

export default async function DashboardHomePage() {
  try {
    return await renderDashboard();
  } catch (e: any) {
    console.error('[dashboard] FATAL:', e);
    return (
      <div className="max-w-3xl mx-auto bg-red-50 border-2 border-red-300 rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg font-bold text-red-900">Erreur dashboard (capturée)</h1>
            <p className="text-sm text-red-800 mt-1">
              La page n'a pas pu se charger. Voici le détail technique :
            </p>
          </div>
        </div>

        <div className="bg-white border border-red-200 rounded-lg p-3 space-y-2 text-xs font-mono">
          <div>
            <strong className="text-red-700">Message :</strong>
            <pre className="mt-1 whitespace-pre-wrap break-all text-slate-800">{e?.message ?? 'Erreur sans message'}</pre>
          </div>
          {e?.name && (
            <div>
              <strong className="text-red-700">Type :</strong>{' '}
              <span className="text-slate-800">{e.name}</span>
            </div>
          )}
          {e?.stack && (
            <details>
              <summary className="cursor-pointer text-red-700 font-bold">Stack trace</summary>
              <pre className="mt-1 whitespace-pre-wrap break-all text-slate-600 text-[10px]">{e.stack}</pre>
            </details>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <a href="/dashboard" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded">
            Réessayer
          </a>
          <a href="/" className="bg-white border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded">
            Accueil
          </a>
        </div>
      </div>
    );
  }
}

async function renderDashboard() {
  const user = await requireUser();

  if (!user.profile.hotel_id) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-amber-50 border border-amber-200 rounded-xl">
        <h2 className="font-semibold text-amber-900 mb-2">Compte non rattaché</h2>
        <p className="text-sm text-amber-800">Votre compte n'est associé à aucun hôtel.</p>
      </div>
    );
  }

  const d = await fetchDashboardData(user.profile.hotel_id);
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -right-4 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        <div className="relative">
          <p className="text-brand-100 text-sm">{formatDate(now)}</p>
          <h1 className="text-3xl font-bold mt-1">{greeting}, {user.profile.prenom} 👋</h1>
          <p className="text-brand-100 mt-2 max-w-xl">
            {d.arrivals.length > 0 || d.departures.length > 0 ? (
              <>Vous avez <strong className="text-white">{d.arrivals.length} arrivée{d.arrivals.length > 1 ? 's' : ''}</strong> et{' '}
              <strong className="text-white">{d.departures.length} départ{d.departures.length > 1 ? 's' : ''}</strong> aujourd'hui.</>
            ) : (
              "Aucun mouvement prévu aujourd'hui. Profitez-en pour faire le point."
            )}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={BedDouble} label="Taux d'occupation" value={`${d.occupancy}%`} subtitle={`${d.occupied}/${d.totalRooms} chambres`} tone="brand" />
        <KpiCard icon={Receipt} label="Revenus du jour" value={formatMoney(d.revenueToday)} subtitle={`Mois : ${formatMoney(d.revenueMonth)}`} tone="emerald" />
        <KpiCard icon={TrendingUp} label="ADR" value={formatMoney(d.adr)} subtitle={`RevPAR : ${formatMoney(d.revpar)}`} tone="amber" />
        <KpiCard icon={Sparkles} label="Tâches ménage" value={d.tasksOpen} subtitle="En attente / en cours" tone="rose" />
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Arrivées du jour" count={d.arrivals.length} icon={LogIn} href="/reservations?filter=today" color="emerald">
          {d.arrivals.length === 0 ? (
            <EmptyMsg>Aucune arrivée aujourd'hui.</EmptyMsg>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.arrivals.map((r: any) => (
                <ListItem key={r.id} href={`/reservations/${r.id}`}
                  primary={`${r.guest?.prenom ?? ''} ${r.guest?.nom ?? ''}`}
                  secondary={r.room?.numero ? `Ch. ${r.room.numero}` : 'Non assignée'}
                  refLabel={r.reference} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Départs du jour" count={d.departures.length} icon={LogOut} href="/reservations?filter=today" color="amber">
          {d.departures.length === 0 ? (
            <EmptyMsg>Aucun départ aujourd'hui.</EmptyMsg>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.departures.map((r: any) => (
                <ListItem key={r.id} href={`/reservations/${r.id}`}
                  primary={`${r.guest?.prenom ?? ''} ${r.guest?.nom ?? ''}`}
                  secondary={r.room?.numero ? `Ch. ${r.room.numero}` : '—'}
                  refLabel={r.reference} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Clients en séjour" count={d.inHouse.length} icon={Users} href="/reservations?filter=check_in" color="brand">
          {d.inHouse.length === 0 ? (
            <EmptyMsg>Aucun client en séjour.</EmptyMsg>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.inHouse.map((r: any) => (
                <ListItem key={r.id} href={`/reservations/${r.id}`}
                  primary={`${r.guest?.prenom ?? ''} ${r.guest?.nom ?? ''}`}
                  secondary={`Ch. ${r.room?.numero ?? '?'} · Départ ${r.date_depart ? formatDate(r.date_depart) : '—'}`}
                  amount={Number(r.prix_total ?? 0)} />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Revenus + Paiements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900">Revenus des 7 derniers jours</h3>
              <p className="text-sm text-slate-500">Total : <span className="font-semibold text-slate-900">{formatMoney(d.revenueWeek)}</span></p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {d.last7Days.map((day, i) => {
              const h = day.revenue > 0 ? Math.max(8, (day.revenue / d.maxRev) * 100) : 4;
              const isToday = i === d.last7Days.length - 1;
              return (
                <div key={day.iso} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="text-[10px] font-semibold text-slate-500">
                    {day.revenue > 0 ? Math.round(day.revenue / 1000) + 'k' : ''}
                  </div>
                  <div className="w-full bg-slate-100 rounded-md relative overflow-hidden" style={{ height: '100%' }}>
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-md transition-all ${isToday ? 'bg-gradient-to-t from-brand-600 to-brand-400' : 'bg-gradient-to-t from-slate-400 to-slate-300'}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <div className={`text-[11px] capitalize ${isToday ? 'font-bold text-brand-700' : 'text-slate-500'}`}>{day.day}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-1">Méthodes de paiement</h3>
          <p className="text-xs text-slate-500 mb-4">Sur les 7 derniers jours</p>
          {d.payByMethod.length === 0 ? (
            <EmptyMsg>Aucun paiement cette semaine.</EmptyMsg>
          ) : (
            <ul className="space-y-3">
              {d.payByMethod.sort((a, b) => b.total - a.total).map((p) => (
                <li key={p.methode}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{PAY_LABELS[p.methode] ?? p.methode}</span>
                    <span className="text-slate-600 text-xs">{formatMoney(p.total)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${PAY_COLORS[p.methode] ?? 'bg-slate-400'}`} style={{ width: `${p.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Statuts chambres + Restaurant + Arrivées */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">État des chambres</h3>
            <Link href="/rooms" className="text-xs text-brand-600 hover:underline">Voir tout →</Link>
          </div>
          {d.totalRooms > 0 && (
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mb-4">
              {(['disponible', 'occupee', 'nettoyage', 'maintenance', 'hors_service'] as RoomStatus[]).map((s) => {
                const count = d.statusCounts[s];
                const pct = (count / d.totalRooms) * 100;
                return pct > 0 ? <div key={s} className={ROOM_COLORS[s]} style={{ width: `${pct}%` }} /> : null;
              })}
            </div>
          )}
          <ul className="space-y-2 text-sm">
            {(['disponible', 'occupee', 'nettoyage', 'maintenance', 'hors_service'] as RoomStatus[]).map((s) => (
              <li key={s} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${ROOM_COLORS[s]}`} />
                  <RoomStatusBadge status={s} />
                </div>
                <span className="font-semibold">{d.statusCounts[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-orange-500" /> Restaurant
            </h3>
            <Link href="/restaurant" className="text-xs text-brand-600 hover:underline">Hub →</Link>
          </div>
          <div className="space-y-3">
            <MiniStat label="Commandes du jour" value={d.ordersCount} accent="text-orange-600" />
            <MiniStat label="En préparation" value={d.ordersPending} accent="text-amber-600" />
            <MiniStat label="CA restaurant" value={formatMoney(d.ordersRevenue)} accent="text-emerald-600" />
            <Link href="/restaurant/kitchen" className="block w-full text-center bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-medium py-2 rounded-lg transition mt-2">
              Voir la cuisine →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-500" /> Prochaines arrivées
            </h3>
            <Link href="/reservations/calendar" className="text-xs text-brand-600 hover:underline">Calendrier →</Link>
          </div>
          {d.upcomingReservations.length === 0 ? (
            <EmptyMsg>Aucune arrivée prévue.</EmptyMsg>
          ) : (
            <ul className="space-y-2">
              {d.upcomingReservations.map((r: any) => (
                <li key={r.id}>
                  <Link href={`/reservations/${r.id}`} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex flex-col items-center justify-center text-[10px] font-bold shrink-0">
                      {r.date_arrivee ? (
                        <>
                          <span>{new Date(r.date_arrivee).getDate()}</span>
                          <span className="uppercase">{new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(r.date_arrivee))}</span>
                        </>
                      ) : <span>?</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.guest?.prenom ?? ''} {r.guest?.nom ?? ''}</div>
                      <div className="text-xs text-slate-500">{r.room?.numero ? `Ch. ${r.room.numero}` : 'Non assignée'}</div>
                    </div>
                    <div className="text-xs font-semibold text-slate-600">{formatMoney(Number(r.prix_total ?? 0))}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" /> Activité récente
          </h3>
        </div>
        {d.recentActivity.length === 0 ? (
          <EmptyMsg>Aucune activité récente.</EmptyMsg>
        ) : (
          <ul className="space-y-3">
            {d.recentActivity.map((r: any) => (
              <li key={r.id} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                <Link href={`/reservations/${r.id}`} className="flex-1 truncate hover:text-brand-700">
                  Réservation <span className="font-mono text-xs">{r.reference}</span> — {r.guest?.prenom ?? ''} {r.guest?.nom ?? ''}
                </Link>
                {r.statut && <ReservationStatusBadge status={r.statut} />}
                <span className="text-xs text-slate-400 shrink-0">{r.created_at ? formatRelative(r.created_at) : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ============ SUB-COMPONENTS ============

function KpiCard({ icon: Icon, label, value, subtitle, tone }: any) {
  const tones: Record<string, { bg: string; icon: string }> = {
    brand:   { bg: 'from-brand-50 to-white',   icon: 'bg-brand-100 text-brand-700' },
    emerald: { bg: 'from-emerald-50 to-white', icon: 'bg-emerald-100 text-emerald-700' },
    amber:   { bg: 'from-amber-50 to-white',   icon: 'bg-amber-100 text-amber-700' },
    rose:    { bg: 'from-rose-50 to-white',    icon: 'bg-rose-100 text-rose-700' }
  };
  const t = tones[tone] ?? tones.brand;
  return (
    <div className={`bg-gradient-to-br ${t.bg} border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow transition`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${t.icon} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1 leading-tight">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function Panel({ title, count, icon: Icon, href, color, children }: any) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    brand: 'bg-brand-50 text-brand-700'
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <span className={`w-7 h-7 rounded-lg ${colors[color]} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </span>
          {title}
          <span className="text-sm font-semibold text-slate-400">({count})</span>
        </h3>
        <Link href={href} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
          Voir <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ListItem({ href, primary, secondary, refLabel, amount }: any) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{primary}</div>
          <div className="text-xs text-slate-500 truncate">{secondary}</div>
        </div>
        {refLabel && <span className="text-[10px] font-mono text-slate-400 shrink-0">{refLabel}</span>}
        {amount != null && <span className="text-xs font-semibold text-slate-700 shrink-0">{formatMoney(amount)}</span>}
      </Link>
    </li>
  );
}

function MiniStat({ label, value, accent }: any) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={`font-bold ${accent}`}>{value}</span>
    </div>
  );
}

function EmptyMsg({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-400 text-center py-4">{children}</p>;
}

function formatRelative(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
  } catch { return ''; }
}
