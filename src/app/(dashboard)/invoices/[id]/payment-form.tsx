'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Smartphone, CreditCard, Banknote, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { recordPayment } from '../actions';

const METHODS = [
  { v: 'especes', l: 'Espèces', icon: Banknote, color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  { v: 'wave', l: 'Wave', icon: Smartphone, color: 'bg-sky-50 border-sky-200 text-sky-900' },
  { v: 'orange_money', l: 'Orange Money', icon: Smartphone, color: 'bg-orange-50 border-orange-200 text-orange-900' },
  { v: 'mtn_money', l: 'MTN Money', icon: Smartphone, color: 'bg-yellow-50 border-yellow-200 text-yellow-900' },
  { v: 'moov_money', l: 'Moov Money', icon: Smartphone, color: 'bg-blue-50 border-blue-200 text-blue-900' },
  { v: 'carte', l: 'Carte bancaire', icon: CreditCard, color: 'bg-slate-50 border-slate-200 text-slate-900' },
  { v: 'virement', l: 'Virement', icon: Building2, color: 'bg-purple-50 border-purple-200 text-purple-900' }
] as const;

export function PaymentForm({ invoiceId, maxAmount }: { invoiceId: string; maxAmount: number }) {
  const [pending, start] = useTransition();
  const [methode, setMethode] = useState<string>('especes');
  const [montant, setMontant] = useState(maxAmount);
  const [ref, setRef] = useState('');

  const needsRef = ['wave', 'orange_money', 'mtn_money', 'moov_money', 'virement'].includes(methode);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (montant <= 0) {
      toast.error('Montant invalide');
      return;
    }
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await recordPayment(fd);
      if (r.ok) {
        toast.success('Paiement enregistré');
        setMontant(0);
        setRef('');
      } else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="invoice_id" value={invoiceId} />

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Méthode</label>
        <div className="grid grid-cols-2 gap-1.5">
          {METHODS.map((m) => {
            const Icon = m.icon;
            const active = methode === m.v;
            return (
              <button
                key={m.v}
                type="button"
                onClick={() => setMethode(m.v)}
                className={`text-xs px-2 py-2 rounded border flex items-center gap-1.5 transition ${
                  active ? m.color + ' ring-2 ring-offset-1 ring-brand-400' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {m.l}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="methode" value={methode} />
      </div>

      <Field label="Montant (XOF)" required>
        <Input
          name="montant"
          type="number"
          min={1}
          max={maxAmount}
          step={100}
          value={montant}
          onChange={(e) => setMontant(Number(e.target.value))}
          required
        />
      </Field>

      {needsRef && (
        <Field label="Référence transaction" hint="N° de transaction Wave / OM / MTN / Moov">
          <Input
            name="reference_transaction"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="TXN123456789"
          />
        </Field>
      )}
      {!needsRef && <input type="hidden" name="reference_transaction" value="" />}

      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        Encaisser
      </Button>
    </form>
  );
}
