'use client';

import { useState, useTransition } from 'react';
import {
  Plus, Trash2, ToggleLeft, ToggleRight, Loader2,
  Edit2, Tag, Percent, DollarSign, Calendar, Sun, Clock
} from 'lucide-react';
import {
  upsertPricingRule, deletePricingRule, togglePricingRule,
  upsertPromoCode, deletePromoCode, togglePromoCode
} from './actions';

type RoomType = { id: string; libelle: string };

type PricingRule = {
  id: string;
  nom: string;
  type: 'saison' | 'weekend' | 'promo';
  room_type_id: string | null;
  date_debut: string | null;
  date_fin: string | null;
  days_of_week: number[] | null;
  modifier_pct: number;
  priorite: number;
  actif: boolean;
};

type PromoCode = {
  id: string;
  code: string;
  description: string | null;
  discount_pct: number | null;
  discount_fixed: number | null;
  date_debut: string | null;
  date_fin: string | null;
  max_uses: number | null;
  uses_count: number;
  actif: boolean;
};

const TYPE_LABELS: Record<string, string> = {
  saison: '🌴 Saison',
  weekend: '🎉 Week-end',
  promo: '🏷️ Promo'
};

const TYPE_COLORS: Record<string, string> = {
  saison: 'bg-blue-100 text-blue-700',
  weekend: 'bg-purple-100 text-purple-700',
  promo: 'bg-orange-100 text-orange-700'
};

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// ── Formulaire règle ──────────────────────────────────────────────────────

function RuleForm({ roomTypes, onDone, initial }: {
  roomTypes: RoomType[];
  onDone: () => void;
  initial?: PricingRule;
}) {
  const [type, setType] = useState(initial?.type ?? 'saison');
  const [selectedDays, setSelectedDays] = useState<number[]>(initial?.days_of_week ?? [0, 5, 6]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function toggleDay(d: number) {
    setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    if (type === 'weekend') fd.set('days_of_week', selectedDays.join(','));

    startTransition(async () => {
      const res = await upsertPricingRule(fd, initial?.id);
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 rounded-xl border border-slate-200 p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Nom de la règle *</label>
          <input name="nom" required defaultValue={initial?.nom} placeholder="Ex: Saison haute été"
            className="input" />
        </div>
        <div>
          <label className="label">Type *</label>
          <select name="type" value={type} onChange={e => setType(e.target.value as any)} className="input">
            <option value="saison">🌴 Saisonnalité</option>
            <option value="weekend">🎉 Week-end</option>
            <option value="promo">🏷️ Promotion</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Chambre concernée</label>
          <select name="room_type_id" defaultValue={initial?.room_type_id ?? ''} className="input">
            <option value="">Toutes les chambres</option>
            {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.libelle}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Variation de prix (%)*</label>
          <input name="modifier_pct" type="number" step="0.5" required
            defaultValue={initial?.modifier_pct ?? 20}
            placeholder="+20 = +20%, -10 = -10%"
            className="input" />
          <p className="text-xs text-slate-400 mt-1">Positif = majoration · Négatif = réduction</p>
        </div>
      </div>

      {/* Dates (pour saison & promo) */}
      {(type === 'saison' || type === 'promo') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date début</label>
            <input name="date_debut" type="date" defaultValue={initial?.date_debut ?? ''} className="input" />
          </div>
          <div>
            <label className="label">Date fin</label>
            <input name="date_fin" type="date" defaultValue={initial?.date_fin ?? ''} className="input" />
          </div>
        </div>
      )}

      {/* Jours (pour weekend) */}
      {type === 'weekend' && (
        <div>
          <label className="label">Jours concernés</label>
          <div className="flex gap-2 flex-wrap mt-1">
            {DAYS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border
                  ${selectedDays.includes(i)
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-brand-400'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Priorité</label>
          <input name="priorite" type="number" defaultValue={initial?.priorite ?? 0} className="input" />
          <p className="text-xs text-slate-400 mt-1">Plus élevé = appliqué en premier</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending}
          className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-brand-700 transition disabled:opacity-60">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {initial ? 'Modifier' : 'Ajouter la règle'}
        </button>
        <button type="button" onClick={onDone}
          className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition border border-slate-300">
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── Formulaire code promo ─────────────────────────────────────────────────

function PromoForm({ onDone, initial }: { onDone: () => void; initial?: PromoCode }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [discountType, setDiscountType] = useState<'pct' | 'fixed'>(
    initial?.discount_fixed != null ? 'fixed' : 'pct'
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const res = await upsertPromoCode(new FormData(e.currentTarget), initial?.id);
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 rounded-xl border border-slate-200 p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Code promo *</label>
          <input name="code" required defaultValue={initial?.code}
            placeholder="Ex: SUMMER25" className="input uppercase"
            style={{ textTransform: 'uppercase' }} />
        </div>
        <div>
          <label className="label">Description</label>
          <input name="description" defaultValue={initial?.description ?? ''}
            placeholder="Ex: 25% pour l'été 2026" className="input" />
        </div>
      </div>

      <div>
        <label className="label">Type de réduction</label>
        <div className="flex gap-2 mb-2">
          {([['pct', 'Pourcentage (%)'], ['fixed', 'Montant fixe (FCFA)']] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setDiscountType(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition
                ${discountType === v ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-300'}`}>
              {l}
            </button>
          ))}
        </div>
        {discountType === 'pct' ? (
          <input name="discount_pct" type="number" min={1} max={100} step={0.5}
            defaultValue={initial?.discount_pct ?? 10}
            placeholder="Ex: 10 pour 10%" className="input" />
        ) : (
          <input name="discount_fixed" type="number" min={1}
            defaultValue={initial?.discount_fixed ?? ''}
            placeholder="Ex: 5000 FCFA" className="input" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Valable du</label>
          <input name="date_debut" type="date" defaultValue={initial?.date_debut ?? ''} className="input" />
        </div>
        <div>
          <label className="label">Au</label>
          <input name="date_fin" type="date" defaultValue={initial?.date_fin ?? ''} className="input" />
        </div>
      </div>

      <div>
        <label className="label">Nombre max d'utilisations</label>
        <input name="max_uses" type="number" min={1}
          defaultValue={initial?.max_uses ?? ''}
          placeholder="Laisser vide = illimité" className="input" />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending}
          className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-brand-700 transition disabled:opacity-60">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
          {initial ? 'Modifier' : 'Créer le code'}
        </button>
        <button type="button" onClick={onDone}
          className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition border border-slate-300">
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── Composant principal ───────────────────────────────────────────────────

export function PricingClient({
  rules: initialRules,
  promoCodes: initialPromos,
  roomTypes
}: {
  rules: PricingRule[];
  promoCodes: PromoCode[];
  roomTypes: RoomType[];
}) {
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editRule, setEditRule] = useState<PricingRule | null>(null);
  const [editPromo, setEditPromo] = useState<PromoCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const rules = initialRules;
  const promoCodes = initialPromos;

  function handleDeleteRule(id: string) {
    if (!confirm('Supprimer cette règle ?')) return;
    startTransition(() => deletePricingRule(id));
  }

  function handleToggleRule(id: string, current: boolean) {
    startTransition(() => togglePricingRule(id, !current));
  }

  function handleDeletePromo(id: string) {
    if (!confirm('Supprimer ce code promo ?')) return;
    startTransition(() => deletePromoCode(id));
  }

  function handleTogglePromo(id: string, current: boolean) {
    startTransition(() => togglePromoCode(id, !current));
  }

  return (
    <div className="space-y-8">
      {/* ── Règles de tarification ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Règles de tarification</h2>
            <p className="text-sm text-slate-500">Appliquez des majorations ou réductions automatiques selon la saison ou le jour.</p>
          </div>
          {!showRuleForm && !editRule && (
            <button onClick={() => setShowRuleForm(true)}
              className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-brand-700 transition text-sm">
              <Plus className="w-4 h-4" /> Nouvelle règle
            </button>
          )}
        </div>

        {(showRuleForm || editRule) && (
          <div className="mb-4">
            <RuleForm
              roomTypes={roomTypes}
              initial={editRule ?? undefined}
              onDone={() => { setShowRuleForm(false); setEditRule(null); }}
            />
          </div>
        )}

        {rules.length === 0 && !showRuleForm ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">Aucune règle de tarification</p>
            <p className="text-sm text-slate-400 mt-1">Créez une règle pour appliquer des prix saisonniers ou de week-end.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id}
                className={`bg-white border rounded-xl p-4 flex items-center gap-3 transition ${rule.actif ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[rule.type]}`}>
                  {TYPE_LABELS[rule.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{rule.nom}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rule.modifier_pct > 0 ? `+${rule.modifier_pct}%` : `${rule.modifier_pct}%`}
                    {rule.room_type_id
                      ? ` · ${roomTypes.find(rt => rt.id === rule.room_type_id)?.libelle ?? 'Type inconnu'}`
                      : ' · Toutes chambres'}
                    {(rule.date_debut || rule.date_fin) && ` · du ${rule.date_debut ?? '…'} au ${rule.date_fin ?? '…'}`}
                    {rule.days_of_week && ` · ${rule.days_of_week.map(d => DAYS[d]).join(', ')}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggleRule(rule.id, rule.actif)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition" title={rule.actif ? 'Désactiver' : 'Activer'}>
                    {rule.actif
                      ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                      : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
                  <button onClick={() => { setEditRule(rule); setShowRuleForm(false); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                  <button onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Codes promo ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Codes promo</h2>
            <p className="text-sm text-slate-500">Créez des codes que vos clients saisissent lors de la réservation en ligne.</p>
          </div>
          {!showPromoForm && !editPromo && (
            <button onClick={() => setShowPromoForm(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm">
              <Plus className="w-4 h-4" /> Nouveau code
            </button>
          )}
        </div>

        {(showPromoForm || editPromo) && (
          <div className="mb-4">
            <PromoForm
              initial={editPromo ?? undefined}
              onDone={() => { setShowPromoForm(false); setEditPromo(null); }}
            />
          </div>
        )}

        {promoCodes.length === 0 && !showPromoForm ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
            <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">Aucun code promo</p>
            <p className="text-sm text-slate-400 mt-1">Créez un code pour offrir des réductions à vos clients.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {promoCodes.map((promo) => (
              <div key={promo.id}
                className={`bg-white border rounded-xl p-4 flex items-center gap-3 transition ${promo.actif ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                <span className="font-mono font-bold text-base text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1 rounded-lg">
                  {promo.code}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">
                    {promo.discount_pct != null ? `-${promo.discount_pct}%` : `-${promo.discount_fixed?.toLocaleString('fr-FR')} FCFA`}
                    {promo.description && ` — ${promo.description}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {promo.uses_count} utilisation{promo.uses_count > 1 ? 's' : ''}
                    {promo.max_uses != null && ` / ${promo.max_uses} max`}
                    {(promo.date_debut || promo.date_fin) && ` · du ${promo.date_debut ?? '…'} au ${promo.date_fin ?? '…'}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleTogglePromo(promo.id, promo.actif)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                    {promo.actif
                      ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                      : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
                  <button onClick={() => { setEditPromo(promo); setShowPromoForm(false); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                  <button onClick={() => handleDeletePromo(promo.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <style jsx global>{`
        .label { display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px; }
        .input { width: 100%; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 0.55rem 0.75rem; font-size: 0.875rem; outline: none; background: white; }
        .input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
      `}</style>
    </div>
  );
}
