import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ArrowLeft, Wallet } from 'lucide-react';
import { getPublicHotelBySlug } from '@/lib/availability';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Réservation confirmée' };

export default async function BookingConfirmationPage(props: {
  params: Promise<{ hotelSlug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { hotelSlug } = await props.params;
  const { ref } = await props.searchParams;

  const hotel = await getPublicHotelBySlug(hotelSlug);
  if (!hotel) notFound();

  // Montant de la réservation (pour calculer l'acompte affiché)
  let prixTotal = 0;
  if (ref) {
    const sb = createAdminClient();
    const { data: resa } = await sb
      .from('reservations')
      .select('prix_total')
      .eq('hotel_id', hotel.id)
      .eq('reference', ref)
      .maybeSingle();
    prixTotal = Number((resa as any)?.prix_total ?? 0);
  }

  const p = hotel.paiement;
  const pct = p?.acompte_pct ?? 0;
  const acompte = pct > 0 ? Math.round((prixTotal * pct) / 100) : 0;
  const showPayment = !!p?.numero;

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Demande envoyée 🎉</h1>
        <p className="mt-2 text-slate-600 leading-relaxed">
          Merci ! Votre demande de réservation chez <strong>{hotel.nom}</strong> a bien été enregistrée.
          L'établissement va la <strong>confirmer</strong> et vous recontacter rapidement.
        </p>

        {ref && (
          <div className="mt-5 inline-block bg-slate-50 border border-slate-200 rounded-xl px-5 py-3">
            <p className="text-xs text-slate-500 uppercase font-semibold">Votre référence</p>
            <p className="text-lg font-mono font-bold text-slate-900">{ref}</p>
          </div>
        )}

        {showPayment && (
          <div className="mt-6 text-left bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <p className="font-semibold text-emerald-900 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Garantissez votre réservation
            </p>
            <p className="text-sm text-emerald-800 mt-1">
              Versez {pct > 0 ? <>un acompte de <strong>{formatMoney(acompte, hotel.devise)}</strong> ({pct}%)</> : 'le règlement'}{' '}
              via Wave, Orange Money, MTN ou Moov, puis envoyez la capture à l'hôtel.
            </p>
            <div className="mt-3 bg-white rounded-lg p-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase font-semibold">Numéro</span>
              <span className="text-lg font-bold text-slate-900">{p!.numero}</span>
            </div>
            {p!.nom && (
              <div className="mt-1.5 bg-white rounded-lg p-3 flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase font-semibold">Bénéficiaire</span>
                <span className="text-sm font-medium text-slate-900">{p!.nom}</span>
              </div>
            )}
          </div>
        )}

        <p className="mt-4 text-sm text-slate-500">
          Un email de confirmation vous a été envoyé. Pensez à vérifier vos spams.
        </p>

        <Link
          href={`/reserver/${hotelSlug}`}
          className="mt-7 inline-flex items-center justify-center gap-2 text-brand-600 font-semibold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Faire une autre réservation
        </Link>
      </div>
    </main>
  );
}
