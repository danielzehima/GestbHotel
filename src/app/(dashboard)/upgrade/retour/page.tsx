import Link from 'next/link';
import { CheckCircle2, Clock, XCircle, ArrowRight, LayoutDashboard } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PLAN_LABELS, type Plan } from '@/lib/plan';

export const metadata = { title: 'Paiement — GestHotel' };
export const dynamic = 'force-dynamic';

export default async function PaymentReturnPage() {
  const user = await requireUser();

  let payment: any = null;
  if (user.profile.hotel_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('subscription_payments')
      .select('plan, months, amount, status, reference, created_at')
      .eq('hotel_id', user.profile.hotel_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    payment = data;
  }

  const status = payment?.status ?? 'pending';
  const isDone = status === 'completed';
  const isFailed = ['failed', 'cancelled', 'expired'].includes(status);

  return (
    <div className="max-w-lg mx-auto py-10">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        {isDone ? (
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
        ) : isFailed ? (
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
        ) : (
          <Clock className="w-16 h-16 text-amber-500 mx-auto animate-pulse" />
        )}

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          {isDone ? 'Forfait activé 🎉' : isFailed ? 'Paiement non abouti' : 'Paiement en cours de validation'}
        </h1>

        <p className="mt-2 text-slate-600">
          {isDone ? (
            <>
              Votre forfait <strong>{payment ? PLAN_LABELS[payment.plan as Plan] : ''}</strong> est désormais actif.
              Un reçu vous a été envoyé par email.
            </>
          ) : isFailed ? (
            <>Le paiement n'a pas pu être confirmé. Aucun montant ne vous sera prélevé. Vous pouvez réessayer.</>
          ) : (
            <>
              Nous confirmons votre paiement auprès de GeniusPay. Cela prend généralement quelques secondes.
              Votre forfait sera activé automatiquement — vous pouvez rafraîchir cette page.
            </>
          )}
        </p>

        {payment && (
          <div className="mt-5 inline-flex flex-col items-center gap-1 text-xs text-slate-400">
            {payment.reference && <span>Réf. {payment.reference}</span>}
            <span>{Number(payment.amount).toLocaleString('fr-FR')} FCFA · {payment.months} mois</span>
          </div>
        )}

        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition"
          >
            <LayoutDashboard className="w-4 h-4" /> Tableau de bord
          </Link>
          {!isDone && (
            <Link
              href="/upgrade"
              className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-200 transition"
            >
              Retour aux forfaits <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
