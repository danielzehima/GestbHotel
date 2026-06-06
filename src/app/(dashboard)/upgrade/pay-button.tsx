'use client';

import { useState, useTransition } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { startSubscriptionPayment } from './actions';

type Props = {
  plan: 'basique' | 'standard' | 'premium';
  prixMensuel: number;
  highlight: boolean;
};

const DURATIONS = [
  { months: 1, label: '1 mois' },
  { months: 3, label: '3 mois' },
  { months: 6, label: '6 mois' },
  { months: 12, label: '12 mois' }
];

export function PayButton({ plan, prixMensuel, highlight }: Props) {
  const [months, setMonths] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = prixMensuel * months;

  function handlePay() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('plan', plan);
      fd.set('months', String(months));
      const res = await startSubscriptionPayment(fd);
      if (res.ok) {
        window.location.href = res.checkoutUrl;
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      {/* Sélecteur de durée */}
      <div className="flex flex-wrap gap-1.5">
        {DURATIONS.map((d) => (
          <button
            key={d.months}
            type="button"
            onClick={() => setMonths(d.months)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition ${
              months === d.months
                ? highlight
                  ? 'bg-white text-brand-700 border-white'
                  : 'bg-brand-600 text-white border-brand-600'
                : highlight
                  ? 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-brand-400'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={pending}
        className={`flex items-center justify-center gap-2 w-full text-center font-semibold py-3 rounded-xl transition disabled:opacity-60 ${
          highlight
            ? 'bg-white text-brand-700 hover:bg-brand-50 shadow-lg'
            : 'bg-brand-600 text-white hover:bg-brand-700 shadow'
        }`}
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Redirection…
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Payer {total.toLocaleString('fr-FR')} FCFA
          </>
        )}
      </button>

      <p className={`text-[11px] text-center ${highlight ? 'text-brand-100' : 'text-slate-400'}`}>
        Paiement sécurisé · Wave, Orange, MTN, Moov, carte
      </p>

      {error && (
        <p className="text-xs text-center bg-red-50 text-red-700 border border-red-200 rounded-lg py-2 px-2">
          {error}
        </p>
      )}
    </div>
  );
}
