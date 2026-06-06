import { createClient } from '@/lib/supabase/server';

/**
 * Calcul des indicateurs hôteliers sur une période [from, to) (dates YYYY-MM-DD, to exclusif).
 * Utilise le client authentifié (RLS → données du seul hôtel connecté).
 *
 * - Taux d'occupation = nuitées vendues / nuitées disponibles
 * - ADR (Average Daily Rate) = revenu chambres / nuitées vendues
 * - RevPAR = revenu chambres / nuitées disponibles
 * Le revenu d'un séjour à cheval sur la période est calculé au prorata des nuits dans la période.
 */

const COUNTED_STATUSES = ['confirmee', 'check_in', 'check_out'];

export type Analytics = {
  from: string;
  to: string;
  nightsInPeriod: number;
  roomsCount: number;
  availableRoomNights: number;
  soldRoomNights: number;
  occupancyPct: number;
  roomRevenue: number;
  adr: number;
  revpar: number;
  bookings: number;
  arrivals: number;
  departures: number;
  revenueBySource: { source: string; revenue: number; bookings: number }[];
  byRoomType: { libelle: string; soldNights: number; revenue: number }[];
  devise: string;
};

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);
}
function maxDate(a: string, b: string) { return a > b ? a : b; }
function minDate(a: string, b: string) { return a < b ? a : b; }

export async function computeAnalytics(hotelId: string, from: string, to: string): Promise<Analytics> {
  const supabase = await createClient();
  const nightsInPeriod = Math.max(0, daysBetween(from, to));

  const [{ data: rooms }, { data: hotel }, { data: resas }] = await Promise.all([
    supabase.from('rooms').select('id, statut').eq('hotel_id', hotelId),
    supabase.from('hotels').select('devise').eq('id', hotelId).maybeSingle(),
    supabase
      .from('reservations')
      .select('prix_total, date_arrivee, date_depart, statut, source, room_type:room_types(libelle), room:rooms(room_type:room_types(libelle))')
      .eq('hotel_id', hotelId)
      .in('statut', COUNTED_STATUSES)
      .lt('date_arrivee', to)
      .gt('date_depart', from)
  ]);

  const roomsCount = (rooms ?? []).filter((r: any) => r.statut !== 'hors_service').length;
  const availableRoomNights = roomsCount * nightsInPeriod;

  let soldRoomNights = 0;
  let roomRevenue = 0;
  let arrivals = 0;
  let departures = 0;
  const sourceMap = new Map<string, { revenue: number; bookings: number }>();
  const typeMap = new Map<string, { soldNights: number; revenue: number }>();

  for (const r of (resas ?? []) as any[]) {
    const totalNights = Math.max(1, daysBetween(r.date_arrivee, r.date_depart));
    const ovStart = maxDate(r.date_arrivee, from);
    const ovEnd = minDate(r.date_depart, to);
    const overlap = Math.max(0, daysBetween(ovStart, ovEnd));
    if (overlap === 0) continue;

    const prorated = Number(r.prix_total) * (overlap / totalNights);
    soldRoomNights += overlap;
    roomRevenue += prorated;

    if (r.date_arrivee >= from && r.date_arrivee < to) arrivals++;
    if (r.date_depart >= from && r.date_depart < to) departures++;

    const src = r.source || 'Direct';
    const s = sourceMap.get(src) ?? { revenue: 0, bookings: 0 };
    s.revenue += prorated; s.bookings += 1;
    sourceMap.set(src, s);

    const libelle = r.room?.room_type?.libelle || r.room_type?.libelle || 'Non assigné';
    const t = typeMap.get(libelle) ?? { soldNights: 0, revenue: 0 };
    t.soldNights += overlap; t.revenue += prorated;
    typeMap.set(libelle, t);
  }

  const occupancyPct = availableRoomNights > 0 ? (soldRoomNights / availableRoomNights) * 100 : 0;
  const adr = soldRoomNights > 0 ? roomRevenue / soldRoomNights : 0;
  const revpar = availableRoomNights > 0 ? roomRevenue / availableRoomNights : 0;

  return {
    from,
    to,
    nightsInPeriod,
    roomsCount,
    availableRoomNights,
    soldRoomNights,
    occupancyPct,
    roomRevenue,
    adr,
    revpar,
    bookings: (resas ?? []).length,
    arrivals,
    departures,
    revenueBySource: Array.from(sourceMap.entries())
      .map(([source, v]) => ({ source, revenue: Math.round(v.revenue), bookings: v.bookings }))
      .sort((a, b) => b.revenue - a.revenue),
    byRoomType: Array.from(typeMap.entries())
      .map(([libelle, v]) => ({ libelle, soldNights: v.soldNights, revenue: Math.round(v.revenue) }))
      .sort((a, b) => b.revenue - a.revenue),
    devise: (hotel as any)?.devise ?? 'XOF'
  };
}
