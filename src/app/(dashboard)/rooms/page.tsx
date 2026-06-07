import Link from 'next/link';
import { BedDouble, Plus, Settings2 } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { RoomsGrid } from './rooms-grid';
import type { Room, RoomType } from '@/types/domain';
import type { RoomStatus } from '@/types/database';

export const metadata = { title: 'Chambres — GestHotel' };

type SearchParams = { statut?: RoomStatus };

export default async function RoomsPage(props: { searchParams: Promise<SearchParams> }) {
  const user = await requireRole(['admin', 'receptionniste', 'menage']);
  const { statut } = await props.searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('rooms')
    .select('*, room_type:room_types(id, libelle, type, prix_nuit)')
    .eq('hotel_id', user.profile.hotel_id!)
    .order('numero');

  if (statut) query = query.eq('statut', statut);

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: rooms }, { data: types }, { data: activeResas }] = await Promise.all([
    query,
    supabase
      .from('room_types')
      .select('id, libelle, type, prix_nuit, hotel_id, code, capacite_adultes, capacite_enfants, description, equipements, photos, created_at')
      .eq('hotel_id', user.profile.hotel_id!)
      .order('libelle'),
    // Réservations actives couvrant aujourd'hui AVEC une chambre assignée
    supabase
      .from('reservations')
      .select('room_id')
      .eq('hotel_id', user.profile.hotel_id!)
      .in('statut', ['confirmee', 'check_in'])
      .lte('date_arrivee', today)
      .gt('date_depart', today)
      .not('room_id', 'is', null)
  ]);

  // Chambres réservées aujourd'hui → affichées "occupée" automatiquement.
  // Les statuts physiques (nettoyage/maintenance/hors service) restent prioritaires.
  const PHYSICAL_PRIORITY = ['nettoyage', 'maintenance', 'hors_service'];
  const occupiedToday = new Set((activeResas ?? []).map((r: any) => r.room_id));
  const roomsDisplayed = (rooms ?? []).map((r: any) =>
    occupiedToday.has(r.id) && !PHYSICAL_PRIORITY.includes(r.statut)
      ? { ...r, statut: 'occupee' }
      : r
  );

  const canManage = user.profile.role === 'admin' || user.profile.role === 'receptionniste';

  return (
    <div>
      <PageHeader
        title="Chambres"
        description="État en temps réel et gestion du parc."
        actions={
          canManage && (
            <>
              <Link href="/rooms/types">
                <Button variant="secondary">
                  <Settings2 className="w-4 h-4" />
                  Types de chambres
                </Button>
              </Link>
              <Link href="/rooms/bulk">
                <Button variant="secondary">
                  <Plus className="w-4 h-4" />
                  Créer en masse
                </Button>
              </Link>
              <Link href="/rooms/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Nouvelle chambre
                </Button>
              </Link>
            </>
          )
        }
      />

      {(!rooms || rooms.length === 0) ? (
        <EmptyState
          icon={BedDouble}
          title={statut ? 'Aucune chambre dans ce statut' : 'Aucune chambre enregistrée'}
          description={
            statut
              ? 'Essayez un autre filtre ou ajoutez une chambre.'
              : 'Commencez par créer un type de chambre, puis ajoutez vos chambres physiques.'
          }
          action={
            canManage && !statut ? (
              <Link href="/rooms/types/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Créer un type
                </Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <RoomsGrid
          rooms={roomsDisplayed as unknown as Room[]}
          types={(types ?? []) as RoomType[]}
          canManage={canManage}
          currentStatus={statut}
        />
      )}
    </div>
  );
}
