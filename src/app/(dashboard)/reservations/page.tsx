import Link from 'next/link';
import { CalendarDays, Plus, CalendarRange } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ReservationStatusBadge,
  RESERVATION_STATUS_LABELS
} from '@/components/ui/reservation-status-badge';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { ShareBookingLink } from './share-booking-link';
import type { ReservationStatus } from '@/types/database';

export const metadata = { title: 'Réservations — GestHotel' };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gestb-hotel.vercel.app';

const FILTERS: { value: ReservationStatus | 'all' | 'today'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'en_attente', label: RESERVATION_STATUS_LABELS.en_attente },
  { value: 'confirmee', label: RESERVATION_STATUS_LABELS.confirmee },
  { value: 'check_in', label: RESERVATION_STATUS_LABELS.check_in },
  { value: 'check_out', label: RESERVATION_STATUS_LABELS.check_out },
  { value: 'annulee', label: RESERVATION_STATUS_LABELS.annulee }
];

type SearchParams = { filter?: string };

export default async function ReservationsPage(props: { searchParams: Promise<SearchParams> }) {
  const user = await requireRole(['admin', 'receptionniste']);
  const { filter = 'all' } = await props.searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('reservations')
    .select(
      'id, reference, statut, date_arrivee, date_depart, nb_adultes, nb_enfants, prix_total, acompte, guest:guests(nom, prenom), room:rooms(numero)'
    )
    .eq('hotel_id', user.profile.hotel_id!)
    .order('date_arrivee', { ascending: false })
    .limit(100);

  if (filter === 'today') {
    const today = new Date().toISOString().slice(0, 10);
    query = query.or(`date_arrivee.eq.${today},date_depart.eq.${today}`);
  } else if (filter !== 'all') {
    query = query.eq('statut', filter);
  }

  const { data: reservations } = await query;

  // Slug de l'hôtel pour le lien de réservation public
  const { data: hotel } = await supabase
    .from('hotels')
    .select('slug')
    .eq('id', user.profile.hotel_id!)
    .maybeSingle();
  const bookingUrl = (hotel as any)?.slug ? `${APP_URL}/reserver/${(hotel as any).slug}` : null;

  return (
    <div>
      {bookingUrl && <ShareBookingLink url={bookingUrl} />}

      <PageHeader
        title="Réservations"
        description="Gestion complète des séjours."
        actions={
          <>
            <Link href="/reservations/calendar">
              <Button variant="secondary">
                <CalendarRange className="w-4 h-4" />
                Calendrier
              </Button>
            </Link>
            <Link href="/reservations/new">
              <Button>
                <Plus className="w-4 h-4" />
                Nouvelle réservation
              </Button>
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          const href = f.value === 'all' ? '/reservations' : `/reservations?filter=${f.value}`;
          return (
            <Link
              key={f.value}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition',
                active
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {!reservations || reservations.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aucune réservation"
          description="Créez votre première réservation pour démarrer."
          action={
            <Link href="/reservations/new">
              <Button>
                <Plus className="w-4 h-4" />
                Nouvelle réservation
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Référence</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Chambre</th>
                <th className="text-left px-4 py-3">Arrivée</th>
                <th className="text-left px-4 py-3">Départ</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-center px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservations.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.reference}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {r.guest?.prenom} {r.guest?.nom}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.room?.numero ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(r.date_arrivee)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(r.date_depart)}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatMoney(Number(r.prix_total))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ReservationStatusBadge status={r.statut} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/reservations/${r.id}`}
                      className="text-brand-600 hover:underline text-xs font-medium"
                    >
                      Détails →
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
