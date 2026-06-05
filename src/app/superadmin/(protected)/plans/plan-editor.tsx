'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Save, Plus, X, Loader2, Sparkles } from 'lucide-react';
import { updatePlanPrice } from '../../actions';
import type { PlanPrice } from '@/lib/plan-prices';
import { formatMoney } from '@/lib/utils/format';

export function PlanEditor({ initial }: { initial: PlanPrice }) {
  const [pending, start] = useTransition();
  const [nom, setNom] = useState(initial.nom);
  const [prix, setPrix] = useState<number>(initial.prix_mensuel);
  const [description, setDescription] = useState(initial.description ?? '');
  const [features, setFeatures] = useState<string[]>(initial.features);
  const [highlight, setHighlight] = useState(initial.highlight);
  const [active, setActive] = useState(initial.active);
  const [ordre, setOrdre] = useState(initial.ordre);
  const [newFeature, setNewFeature] = useState('');

  function addFeature() {
    const f = newFeature.trim();
    if (!f) return;
    setFeatures((prev) => [...prev, f]);
    setNewFeature('');
  }

  function removeFeature(idx: number) {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveFeature(idx: number, dir: -1 | 1) {
    setFeatures((prev) => {
      const next = [...prev];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  function save() {
    if (!nom.trim() || prix < 0) {
      toast.error('Nom requis et prix ≥ 0');
      return;
    }
    start(async () => {
      const r = await updatePlanPrice(initial.plan, {
        nom: nom.trim(),
        prix_mensuel: prix,
        description: description.trim() || undefined,
        features,
        highlight,
        active,
        ordre
      });
      if (r.ok) toast.success(`Forfait ${nom} mis à jour`);
      else toast.error(r.error);
    });
  }

  return (
    <div className={`rounded-2xl border-2 p-5 transition ${
      highlight ? 'border-brand-400 bg-gradient-to-br from-brand-50 to-white shadow-md' : 'border-slate-200 bg-white'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Forfait {initial.plan}
        </span>
        {highlight && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-brand-600 text-white px-2 py-0.5 rounded">
            <Sparkles className="w-3 h-3" /> Mis en avant
          </span>
        )}
        {!active && (
          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
            Désactivé
          </span>
        )}
      </div>

      <div className="space-y-3">
        <Field label="Nom commercial">
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            maxLength={50}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Prix mensuel (XOF)">
            <input
              type="number"
              value={prix}
              onChange={(e) => setPrix(Number(e.target.value))}
              min={0}
              step={500}
              className={inputCls}
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Affiché : {formatMoney(prix)}/mois
            </p>
          </Field>
          <Field label="Ordre d'affichage">
            <input
              type="number"
              value={ordre}
              onChange={(e) => setOrdre(Number(e.target.value))}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Description courte">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={inputCls + ' min-h-[60px]'}
          />
        </Field>

        <Field label="Fonctionnalités incluses">
          <ul className="space-y-1.5">
            {features.map((f, idx) => (
              <li key={idx} className="flex items-center gap-1 group">
                <span className="text-emerald-500">✓</span>
                <input
                  value={f}
                  onChange={(e) => setFeatures((prev) => prev.map((x, i) => (i === idx ? e.target.value : x)))}
                  className="flex-1 text-xs px-2 py-1 border border-slate-200 rounded"
                />
                <button
                  type="button"
                  onClick={() => moveFeature(idx, -1)}
                  disabled={idx === 0}
                  title="Monter"
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30 px-1"
                >↑</button>
                <button
                  type="button"
                  onClick={() => moveFeature(idx, 1)}
                  disabled={idx === features.length - 1}
                  title="Descendre"
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30 px-1"
                >↓</button>
                <button
                  type="button"
                  onClick={() => removeFeature(idx)}
                  title="Supprimer"
                  className="text-red-500 hover:bg-red-50 p-1 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-1 mt-2">
            <input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
              placeholder="Nouvelle fonctionnalité…"
              className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded"
            />
            <button
              type="button"
              onClick={addFeature}
              className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs"
            >
              <Plus className="w-3 h-3" /> Ajouter
            </button>
          </div>
        </Field>

        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={highlight}
              onChange={(e) => setHighlight(e.target.checked)}
            />
            Mis en avant (badge "Recommandé")
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Forfait actif (visible publiquement)
          </label>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
