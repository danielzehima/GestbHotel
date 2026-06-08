import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CheckCircle2, ArrowLeft, Wallet, Hotel, MailCheck, Clock, CalendarCheck, Phone
} from 'lucide-react';
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

  const STEPS = [
    { icon: CheckCircle2, title: 'Demande reçue', desc: 'Votre demande est enregistrée.', done: true },
    { icon: Clock, title: 'Confirmation', desc: `${hotel.nom} valide votre réservation.`, done: false },
    { icon: CalendarCheck, title: 'Séjour', desc: 'On vous attend !', done: false }
  ];

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-10">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 overflow-hidden">
        {/* Bandeau succès */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 px-8 pt-9 pb-12 text-center text-white">
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur flex items-center justify-center mx-auto ring-4 ring-white/20">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Demande envoyée 🎉</h1>
            <p className="mt-1 text-emerald-50 text-sm">
              Merci ! Votre demande chez <strong>{hotel.nom}</strong> est bien enregistrée.
            </p>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-7">
          {/* Référence */}
          {ref && (
            <div className="-mt-12 relative bg-white border border-slate-200 rounded-2xl px-5 py-3 text-center shadow-sm">
              <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Votre référence</p>
              <p className="text-xl font-mono font-bold text-slate-900">{ref}</p>
            </div>
          )}

          {/* Prochaines étapes */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Prochaines étapes</p>
            <ol className="space-y-3">
              {STEPS.map(({ icon: Icon, title, desc, done }, i) => (
                <li key={title} className="flex items-start gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex-1 pt-0.5">
                    <p className={`text-sm font-semibold ${done ? 'text-slate-900' : 'text-slate-600'}`}>
                      {i + 1}. {title}
                    </p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Paiement / acompte */}
          {showPayment && (
            <div className="mt-6 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-2xl p-5">
              <p className="font-semibold text-emerald-900 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Garantissez votre réservation
              </p>
              <p className="text-sm text-emerald-800 mt-1">
                Versez {pct > 0 ? <>un acompte de <strong>{formatMoney(acompte, hotel.devise)}</strong> ({pct}%)</> : 'le règlement'}{' '}
                via Wave, Orange Money, MTN ou Moov, puis envoyez la capture à l'hôtel.
              </p>
              <div className="mt-3 bg-white rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase font-semibold">Numéro</span>
                <span className="text-lg font-bold text-slate-900">{p!.numero}</span>
              </div>
              {p!.nom && (
                <div className="mt-1.5 bg-white rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Bénéficiaire</span>
                  <span className="text-sm font-medium text-slate-900">{p!.nom}</span>
                </div>
              )}
            </div>
          )}

          {/* Email + contact */}
          <div className="mt-5 flex items-start gap-2 text-sm text-slate-500 bg-slate-50 rounded-xl p-3">
            <MailCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>Un email de confirmation vous a été envoyé. Pensez à vérifier vos spams.</span>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <Link
              href={`/reserver/${hotelSlug}`}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-4 py-3 rounded-xl hover:bg-brand-700 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Nouvelle réservation
            </Link>
            {hotel.telephone && (
              <a
                href={`tel:${hotel.telephone}`}
                className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-4 py-3 rounded-xl hover:bg-slate-50 transition"
              >
                <Phone className="w-4 h-4" /> Contacter l'hôtel
              </a>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 py-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Hotel className="w-3.5 h-3.5" /> Propulsé par <strong>GestHotel</strong>
        </div>
      </div>
    </main>
  );
}
