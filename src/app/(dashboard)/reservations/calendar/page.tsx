import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { CalendarGrid } from './calendar-grid';

export const metadata = { title: 'Calendrier — GestHotel' };

type SearchParams = { month?: string };

function monthBounds(monthParam?: string) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-based
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number);
    year = y;
    month = m - 1;
  }
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  return { year, month, start, end, startStr, endStr };
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default async function CalendarPage(props: { searchParams: Promise<SearchParams> }) {
  const user = await requireRole(['admin', 'receptionniste']);
  const { month } = await props.searchParams;
  const { year, month: m, start, end, startStr, endStr } = monthBounds(month);

  const supabase = await createClient();

  const [{ data: rooms }, { data: reservations }] = await Promise.all([
    supabase
      .from('rooms')
      .select('id, numero, etage, room_type:room_types(libelle)')
      .eq('hotel_id', user.profile.hotel_id!)
      .order('numero'),
    supabase
      .from('reservations')
      .select('id, reference, statut, date_arrivee, date_depart, room_id, guest:guests(nom, prenom)')
      .eq('hotel_id', user.profile.hotel_id!)
      .in('statut', ['confirmee', 'check_in', 'check_out'])
      .lte('date_arrivee', endStr)
      .gte('date_depart', startStr)
  ]);

  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(start);
  const prevHref = `/reservations/calendar?month=${shiftMonth(year, m, -1)}`;
  const nextHref = `/reservations/calendar?month=${shiftMonth(year, m, 1)}`;

  return (
    <div>
      <PageHeader
        title="Calendrier"
        description="Vue mensuelle des occupations par chambre."
        actions={
          <Link href="/reservations/new">
            <Button>
              <Plus className="w-4 h-4" />
              Nouvelle
            </Button>
          </Link>
        }
      />

      <div className="flex items-center justify-between mb-4">
        <Link href={prevHref}>
          <Button variant="secondary" size="sm">
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </Button>
        </Link>
        <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
        <Link href={nextHref}>
          <Button variant="secondary" size="sm">
            Suivant
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <CalendarGrid
        year={year}
        month={m}
        startStr={startStr}
        endStr={endStr}
        daysInMonth={end.getUTCDate()}
        rooms={(rooms ?? []) as any}
        reservations={(reservations ?? []) as any}
      />
    </div>
  );
}
