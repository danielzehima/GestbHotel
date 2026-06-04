import Link from 'next/link';
import { CalendarClock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ShiftsWeek } from './shifts-week';

export const metadata = { title: 'Plannings — GestHotel' };

function startOfWeek(d: Date) {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // lundi
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
}

function addDays(d: Date, n: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

type SearchParams = { week?: string };

export default async function ShiftsPage(props: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const { week } = await props.searchParams;
  const supabase = await createClient();

  const ref = week ? new Date(week + 'T00:00:00Z') : new Date();
  const monday = startOfWeek(ref);
  const sunday = addDays(monday, 6);
  const mondayStr = isoDay(monday);
  const sundayStr = isoDay(sunday);

  const isAdmin = user.profile.role === 'admin';

  let shiftQuery = supabase
    .from('shifts')
    .select('id, profile_id, date, type, heure_debut, heure_fin, notes, profile:profiles!shifts_profile_id_fkey(nom, prenom, role)')
    .eq('hotel_id', user.profile.hotel_id!)
    .gte('date', mondayStr)
    .lte('date', sundayStr);

  if (!isAdmin) shiftQuery = shiftQuery.eq('profile_id', user.profile.id);

  const [{ data: shifts }, { data: staff }] = await Promise.all([
    shiftQuery,
    supabase
      .from('profiles')
      .select('id, nom, prenom, role')
      .eq('hotel_id', user.profile.hotel_id!)
      .order('nom')
  ]);

  const weekLabel = `Semaine du ${new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(monday)}`;
  const prevHref = `/shifts?week=${isoDay(addDays(monday, -7))}`;
  const nextHref = `/shifts?week=${isoDay(addDays(monday, 7))}`;

  return (
    <div>
      <PageHeader
        title="Plannings"
        description={isAdmin ? 'Affectations hebdomadaires.' : 'Vos affectations.'}
        actions={
          isAdmin && (
            <Link href="/shifts/new">
              <Button>
                <Plus className="w-4 h-4" />
                Nouveau shift
              </Button>
            </Link>
          )
        }
      />

      <div className="flex items-center justify-between mb-4">
        <Link href={prevHref}>
          <Button variant="secondary" size="sm">
            <ChevronLeft className="w-4 h-4" />
            Semaine -1
          </Button>
        </Link>
        <h2 className="text-lg font-semibold capitalize">{weekLabel}</h2>
        <Link href={nextHref}>
          <Button variant="secondary" size="sm">
            Semaine +1
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {!shifts || shifts.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Aucun shift cette semaine"
          description={isAdmin ? 'Créez vos premières affectations.' : 'Aucune affectation pour vous.'}
          action={
            isAdmin && (
              <Link href="/shifts/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Nouveau shift
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <ShiftsWeek
          shifts={shifts as any}
          staff={(staff ?? []) as any}
          monday={mondayStr}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
