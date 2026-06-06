'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { updatePaymentSettings } from './actions';

type Initial = {
  numero: string | null;
  nom: string | null;
  acompte_pct: number;
};

export function PaymentSettingsForm({ initial }: { initial: Initial }) {
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await updatePaymentSettings(fd);
      if (r.ok) toast.success('Paiement des réservations mis à jour');
      else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
        Ces informations s'affichent au client après une réservation en ligne pour qu'il vous verse
        un acompte. <strong>L'argent arrive directement sur votre compte Mobile Money</strong> — GestHotel
        ne touche jamais ces fonds.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Numéro Mobile Money" hint="Wave / Orange Money / MTN / Moov">
          <Input name="mm_numero" defaultValue={initial.numero ?? ''} placeholder="+225 07 00 00 00 00" />
        </Field>
        <Field label="Nom du bénéficiaire" hint="Nom affiché lors du paiement">
          <Input name="mm_nom" defaultValue={initial.nom ?? ''} placeholder="Hôtel Les Palmiers" />
        </Field>
      </div>

      <Field label="Acompte demandé (%)" hint="0 = pas d'acompte (paiement intégral sur place)">
        <Input name="acompte_pct" type="number" min={0} max={100} defaultValue={initial.acompte_pct ?? 0} />
      </Field>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
