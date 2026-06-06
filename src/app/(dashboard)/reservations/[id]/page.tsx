import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ReservationStatusBadge } from '@/components/ui/reservation-status-badge';
import { formatDate, formatDateTime, formatMoney } from '@/lib/utils/format';
import { ReservationActions } from './reservation-actions';
import { GuestWhatsapp } from './guest-whatsapp';

export const metadata = { title: 'Détail réservation — GestHotel' };

export default async function ReservationDetailPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['admin', 'receptionniste']);
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: r } = await supabase
    .from('reservations')
    .select(
      `id, reference, statut, date_arrivee, date_depart, nb_adultes, nb_enfants,
       prix_total, acompte, source, notes, check_in_at, check_out_at, created_at,
       guest:guests(id, nom, prenom, email, telephone, nationalite, type_piece, numero_piece),
       room:rooms(id, numero, etage, room_type:room_types(libelle)),
       room_type:room_types(libelle)`
    )
    .eq('id', id)
    .eq('hotel_id', user.profile.hotel_id!)
    .single();

  if (!r) notFound();
  const res = r as any;

  const { data: hotelRow } = await supabase
    .from('hotels')
    .select('nom')
    .eq('id', user.profile.hotel_id!)
    .maybeSingle();
  const hotelNom = (hotelRow as any)?.nom ?? '';
  const restant = Number(res.prix_total) - Number(res.acompte);
  const nights = Math.round(
    (new Date(res.date_depart).getTime() - new Date(res.date_arrivee).getTime()) / 86400000
  );

  return (
    <div>
      <Link
        href="/reservations"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Toutes les réservations
      </Link>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {res.reference}
            <ReservationStatusBadge status={res.statut} />
          </span>
        }
        description={`${res.guest?.prenom} ${res.guest?.nom} · ${nights} nuit${nights > 1 ? 's' : ''}`}
        actions={
          <>
            <Link href={`/reservations/${res.id}/edit`}>
              <Button variant="secondary">
                <Pencil className="w-4 h-4" />
                Modifier
              </Button>
            </Link>
            <ReservationActions id={res.id} status={res.statut} />
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Séjour */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Séjour</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Arrivée</dt><dd className="font-medium">{formatDate(res.date_arrivee)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Départ</dt><dd className="font-medium">{formatDate(res.date_depart)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Nuits</dt><dd className="font-medium">{nights}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Occupants</dt><dd className="font-medium">{res.nb_adultes} ad. + {res.nb_enfants} enf.</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Chambre</dt><dd className="font-medium">{res.room?.numero ?? '—'} {res.room?.room_type?.libelle && `(${res.room.room_type.libelle})`}</dd></div>
            {res.check_in_at && <div className="flex justify-between"><dt className="text-slate-500">Check-in</dt><dd className="font-medium text-xs">{formatDateTime(res.check_in_at)}</dd></div>}
            {res.check_out_at && <div className="flex justify-between"><dt className="text-slate-500">Check-out</dt><dd className="font-medium text-xs">{formatDateTime(res.check_out_at)}</dd></div>}
          </dl>
        </div>

        {/* Client */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Client</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500 text-xs">Nom</dt><dd className="font-medium">{res.guest?.prenom} {res.guest?.nom}</dd></div>
            {res.guest?.email && <div><dt className="text-slate-500 text-xs">Email</dt><dd>{res.guest.email}</dd></div>}
            {res.guest?.telephone && <div><dt className="text-slate-500 text-xs">Téléphone</dt><dd>{res.guest.telephone}</dd></div>}
            {res.guest?.nationalite && <div><dt className="text-slate-500 text-xs">Nationalité</dt><dd>{res.guest.nationalite}</dd></div>}
            {res.guest?.numero_piece && (
              <div>
                <dt className="text-slate-500 text-xs">Pièce d'identité</dt>
                <dd>{res.guest.type_piece} · {res.guest.numero_piece}</dd>
              </div>
            )}
          </dl>

          {res.guest?.telephone && (
            <GuestWhatsapp
              telephone={res.guest.telephone}
              prenom={res.guest.prenom}
              hotelNom={hotelNom}
              reference={res.reference}
              arrivee={res.date_arrivee}
              depart={res.date_depart}
            />
          )}
        </div>

        {/* Tarifs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Tarifs</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Total</dt><dd className="font-bold text-lg">{formatMoney(Number(res.prix_total))}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Acompte</dt><dd className="font-medium text-emerald-600">{formatMoney(Number(res.acompte))}</dd></div>
            <div className="flex justify-between pt-2 border-t border-slate-100"><dt className="text-slate-500">Restant dû</dt><dd className={`font-bold ${restant > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatMoney(restant)}</dd></div>
            {res.source && <div className="flex justify-between pt-2 border-t border-slate-100"><dt className="text-slate-500">Source</dt><dd>{res.source}</dd></div>}
          </dl>
        </div>
      </div>

      {res.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mt-4">
          <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{res.notes}</p>
        </div>
      )}
    </div>
  );
}
