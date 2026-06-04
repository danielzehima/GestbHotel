'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Loader2, X } from 'lucide-react';
import { setHotelPlan, extendTrial } from '../../actions';
import type { Plan } from '@/lib/plan';

export function PlanActions({
  id,
  nom,
  currentPlan
}: {
  id: string;
  nom: string;
  currentPlan: Plan;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [plan, setPlan] = useState<Plan>(currentPlan);
  const [months, setMonths] = useState(1);
  const [trialDays, setTrialDays] = useState(7);

  function apply() {
    start(async () => {
      const r = await setHotelPlan(id, plan, months);
      if (r.ok) {
        toast.success('Forfait mis à jour');
        setOpen(false);
      } else toast.error(r.error);
    });
  }

  function applyExtendTrial() {
    start(async () => {
      const r = await extendTrial(id, trialDays);
      if (r.ok) {
        toast.success(`Essai prolongé de ${trialDays} jours`);
        setOpen(false);
      } else toast.error(r.error);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Gérer le forfait"
        className="p-1.5 rounded text-brand-600 hover:bg-brand-50"
      >
        <CreditCard className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Gérer le forfait</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Hôtel : <strong>{nom}</strong>
            </p>

            {/* Forfait payant */}
            <div className="border border-slate-200 rounded-lg p-4 mb-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                Activer un forfait payant
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as Plan)}
                  className="px-3 py-2 rounded border border-slate-300 text-sm"
                >
                  <option value="basique">Basique</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
                <select
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="px-3 py-2 rounded border border-slate-300 text-sm"
                >
                  <option value={1}>1 mois</option>
                  <option value={3}>3 mois</option>
                  <option value={6}>6 mois</option>
                  <option value={12}>12 mois</option>
                </select>
              </div>
              <button
                onClick={apply}
                disabled={pending || plan === 'trial'}
                className="mt-3 w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded transition disabled:opacity-60"
              >
                {pending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Activer'}
              </button>
            </div>

            {/* Prolonger essai */}
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
              <label className="block text-xs font-semibold text-amber-900 uppercase mb-2">
                Prolonger l'essai gratuit
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={trialDays}
                  onChange={(e) => setTrialDays(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded border border-amber-300 text-sm bg-white"
                />
                <span className="px-2 py-2 text-sm text-amber-700">jours</span>
              </div>
              <button
                onClick={applyExtendTrial}
                disabled={pending}
                className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 rounded transition"
              >
                {pending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Prolonger l\'essai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
