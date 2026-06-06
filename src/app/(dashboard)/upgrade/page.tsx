import Link from 'next/link';
import { Check, Sparkles, MessageCircle, Mail, Phone, ArrowLeft, ShieldCheck } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getPlanStatus, PLAN_LABELS } from '@/lib/plan';
import { getPlanPrices } from '@/lib/plan-prices';
import { PageHeader } from '@/components/ui/page-header';
import { formatDate } from '@/lib/utils/format';
import { PayButton } from './pay-button';

export const metadata = { title: 'Forfaits — GestHotel' };
export const dynamic = 'force-dynamic';

const PAYMENT_PHONE = '+225 07 10 07 52 57';
const PAYMENT_PHONE_RAW = '+2250710075257';
const PAYMENT_EMAIL = 'danielzehima@gmail.com';

export default async function UpgradePage() {
  const user = await requireUser();
  let status = null;
  let hotelNom = '';

  if (user.profile.hotel_id) {
    const supabase = await createClient();
    const { data: hotel } = await supabase
      .from('hotels')
      .select('nom, plan, plan_expires_at, created_at')
      .eq('id', user.profile.hotel_id)
      .single();
    if (hotel) {
      status = getPlanStatus(hotel as any);
      hotelNom = (hotel as any).nom;
    }
  }

  // Charge les forfaits dynamiques depuis la DB
  const allPrices = await getPlanPrices();
  const PLANS = allPrices
    .filter((p) => p.active)
    .map((p) => ({
      key: p.plan,
      nom: p.nom,
      prix: p.prix_mensuel,
      desc: p.description ?? '',
      features: p.features,
      highlight: p.highlight
    }));

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
      </Link>

      <PageHeader
        title="Choisissez votre forfait"
        description={`Pour ${hotelNom || 'votre hôtel'}. Sans engagement, modifiable à tout moment.`}
      />

      {/* Statut actuel */}
      {status && (
        <div className={`rounded-2xl p-5 border-2 ${
          status.isExpired
            ? 'bg-red-50 border-red-300'
            : status.isTrial
              ? 'bg-amber-50 border-amber-300'
              : 'bg-emerald-50 border-emerald-300'
        }`}>
          <div className="flex items-center gap-3">
            <ShieldCheck className={`w-6 h-6 ${
              status.isExpired ? 'text-red-600' : status.isTrial ? 'text-amber-600' : 'text-emerald-600'
            }`} />
            <div>
              <p className="font-semibold text-slate-900">
                Forfait actuel : <span className="capitalize">{PLAN_LABELS[status.plan]}</span>
                {!status.isExpired && status.daysLeft > 0 && status.daysLeft !== -1 && (
                  <> · <span className="text-sm font-normal">{status.daysLeft} jour{status.daysLeft > 1 ? 's' : ''} restant{status.daysLeft > 1 ? 's' : ''}</span></>
                )}
              </p>
              {status.expiresAt && (
                <p className="text-xs text-slate-600 mt-0.5">
                  {status.isExpired ? 'Expiré le ' : 'Expire le '}{formatDate(status.expiresAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <div
            key={p.key}
            className={`relative rounded-2xl p-6 transition ${
              p.highlight
                ? 'bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-2xl shadow-brand-600/30 scale-[1.02]'
                : 'bg-white border border-slate-200 hover:shadow-lg'
            }`}
          >
            {p.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-emerald-400 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                <Sparkles className="w-3 h-3" />
                Recommandé
              </div>
            )}

            <h3 className={`text-xl font-bold ${p.highlight ? 'text-white' : 'text-slate-900'}`}>{p.nom}</h3>
            <p className={`mt-1 text-sm ${p.highlight ? 'text-brand-100' : 'text-slate-500'}`}>{p.desc}</p>

            <div className="mt-5 mb-5">
              <span className={`text-4xl font-bold ${p.highlight ? 'text-white' : 'text-slate-900'}`}>
                {p.prix.toLocaleString('fr-FR')}
              </span>
              <span className={`ml-1 text-sm ${p.highlight ? 'text-brand-100' : 'text-slate-500'}`}>FCFA / mois</span>
            </div>

            {/* Paiement automatisé GeniusPay */}
            <PayButton plan={p.key as 'basique' | 'standard' | 'premium'} prixMensuel={p.prix} highlight={!!p.highlight} />

            {/* Secours : paiement manuel par WhatsApp */}
            <div className={`mt-3 pt-3 border-t ${p.highlight ? 'border-white/20' : 'border-slate-100'}`}>
              <p className={`text-[11px] mb-2 text-center ${p.highlight ? 'text-brand-100' : 'text-slate-400'}`}>
                Vous préférez payer manuellement ?
              </p>
              <ContactCTA highlight={!!p.highlight} plan={p.nom} prix={p.prix} hotelNom={hotelNom} />
            </div>

            <ul className="mt-6 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className={`w-4 h-4 mt-0.5 shrink-0 ${p.highlight ? 'text-emerald-300' : 'text-emerald-500'}`} />
                  <span className={p.highlight ? 'text-brand-50' : 'text-slate-700'}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Comment activer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Comment activer mon forfait ?</h2>
        <ol className="space-y-3 text-sm text-slate-700">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
            <span>Choisissez le forfait qui vous convient ci-dessus et cliquez sur <strong>"Activer ce forfait"</strong></span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
            <span>Envoyez votre paiement via <strong>Wave, Orange Money, MTN Money ou Moov Money</strong> au <strong>{PAYMENT_PHONE}</strong></span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
            <span>Envoyez la <strong>capture de paiement</strong> via WhatsApp ou email avec le nom de votre hôtel</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
            <span>Votre forfait est <strong>activé sous 24h ouvrées</strong> — vous recevez un email de confirmation</span>
          </li>
        </ol>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={`https://wa.me/${PAYMENT_PHONE_RAW.replace('+', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium py-3 rounded-lg transition"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
          <a
            href={`tel:${PAYMENT_PHONE_RAW}`}
            className="flex items-center justify-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-medium py-3 rounded-lg transition"
          >
            <Phone className="w-4 h-4" />
            {PAYMENT_PHONE}
          </a>
          <a
            href={`mailto:${PAYMENT_EMAIL}?subject=Activation forfait GestHotel`}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-lg transition"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
        </div>
      </div>
    </div>
  );
}

function ContactCTA({
  highlight,
  plan,
  prix,
  hotelNom
}: {
  highlight: boolean;
  plan: string;
  prix: number;
  hotelNom: string;
}) {
  const message = encodeURIComponent(
    `Bonjour, je souhaite activer le forfait *${plan}* (${prix.toLocaleString('fr-FR')} FCFA/mois) pour mon hôtel "${hotelNom}". Merci de m'indiquer la procédure de paiement.`
  );
  const waLink = `https://wa.me/2250710075257?text=${message}`;

  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 w-full text-center font-medium py-2.5 rounded-xl border transition text-sm ${
        highlight
          ? 'border-white/40 text-white hover:bg-white/10'
          : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
      }`}
    >
      <MessageCircle className="w-4 h-4" />
      Payer via WhatsApp
    </a>
  );
}
