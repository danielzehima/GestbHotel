import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { getHotelIcalToken } from '@/lib/ical-sync';
import { ChannelsClient } from './channels-client';
import { Radio } from 'lucide-react';

export const metadata = { title: 'Channel Manager — GestHotel' };
export const dynamic = 'force-dynamic';

export default async function ChannelsPage() {
  const user = await requireRole(['admin']);
  const hotelId = user.profile.hotel_id!;
  const supabase = await createClient();

  const [{ data: roomTypes }, { data: feeds }, token] = await Promise.all([
    supabase.from('room_types').select('id, libelle').eq('hotel_id', hotelId).order('libelle'),
    supabase
      .from('ical_feeds')
      .select('id, nom, room_type_id, url, actif, derniere_sync, derniere_erreur, events_count')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false }),
    getHotelIcalToken(hotelId),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gestb-hotel.vercel.app';

  // Génère les liens d'export public (un par type de chambre)
  const exportLinks = (roomTypes ?? []).map((rt: any) => ({
    roomTypeId: rt.id,
    libelle: rt.libelle,
    url: `${appUrl}/api/ical/${hotelId}/${rt.id}.ics?token=${token ?? ''}`,
  }));

  return (
    <div>
      <PageHeader
        title="Channel Manager"
        description="Synchronisez vos disponibilités avec Booking.com, Airbnb et Expedia pour éviter le surbooking."
      />

      {/* Bandeau explicatif */}
      <div className="mb-6 bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm text-brand-800 flex gap-3">
        <Radio className="w-5 h-5 shrink-0 mt-0.5 text-brand-600" />
        <div>
          <strong>Comment ça marche ?</strong> Le Channel Manager utilise le standard <strong>iCal</strong>, compatible
          avec toutes les grandes plateformes. <br />
          <strong>Export</strong> : partagez vos liens GestHotel aux OTA → ils bloquent vos dates réservées. <br />
          <strong>Import</strong> : ajoutez les liens des OTA → GestHotel bloque les dates réservées ailleurs.
          La synchronisation a lieu automatiquement chaque jour (ou manuellement via « Synchroniser »).
        </div>
      </div>

      <ChannelsClient
        exportLinks={exportLinks}
        feeds={(feeds ?? []) as any}
        roomTypes={(roomTypes ?? []) as any}
      />
    </div>
  );
}
