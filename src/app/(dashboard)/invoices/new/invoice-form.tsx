'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { formatMoney } from '@/lib/utils/format';
import { createInvoice, createInvoiceFromReservation } from '../actions';

type Guest = { id: string; nom: string; prenom: string };
type Reservation = {
  id: string;
  reference: string;
  date_arrivee: string;
  date_depart: string;
  prix_total: number;
  guest: { nom: string; prenom: string } | null;
  room: { numero: string } | null;
};
type Line = { libelle: string; quantite: number; prix_unitaire: number };

export function InvoiceForm({
  guests,
  reservations
}: {
  guests: Guest[];
  reservations: Reservation[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [generating, startGen] = useTransition();
  const [guestId, setGuestId] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [taxe, setTaxe] = useState(0);
  const [remise, setRemise] = useState(0);
  const [echeance, setEcheance] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([{ libelle: '', quantite: 1, prix_unitaire: 0 }]);

  const sousTotal = lines.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
  const total = Math.max(0, sousTotal + taxe - remise);

  function update(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [...prev, { libelle: '', quantite: 1, prix_unitaire: 0 }]);
  }
  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function onGenerate() {
    if (!reservationId) {
      toast.error('Sélectionnez une réservation');
      return;
    }
    startGen(async () => {
      const r = await createInvoiceFromReservation(reservationId);
      if (r.ok && 'data' in r && r.data) {
        toast.success('Facture générée');
        router.push(`/invoices/${r.data.id}`);
      } else if (!r.ok) toast.error(r.error);
    });
  }

  function onSubmit() {
    if (lines.length === 0 || lines.some((l) => !l.libelle)) {
      toast.error('Renseignez le libellé de chaque ligne');
      return;
    }
    start(async () => {
      const r = await createInvoice({
        guest_id: guestId || null,
        reservation_id: reservationId || null,
        taxe,
        remise,
        date_echeance: echeance,
        notes,
        lines
      });
      if (r.ok && 'data' in r && r.data) {
        toast.success('Facture créée');
        router.push(`/invoices/${r.data.id}`);
      } else if (!r.ok) toast.error(r.error);
    });
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Génération automatique depuis réservation */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
        <h3 className="font-semibold text-brand-900 mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Génération automatique depuis une réservation
        </h3>
        <p className="text-sm text-brand-800 mb-3">
          Sélectionnez une réservation : la facture inclura le séjour + toutes les commandes restaurant liées + déduction de l'acompte.
        </p>
        <div className="flex gap-2">
          <Select value={reservationId} onChange={(e) => setReservationId(e.target.value)} className="flex-1">
            <option value="">— Choisir une réservation —</option>
            {reservations.map((r) => (
              <option key={r.id} value={r.id}>
                {r.reference} · {r.guest?.prenom} {r.guest?.nom} · Ch. {r.room?.numero ?? '?'} · {formatMoney(Number(r.prix_total))}
              </option>
            ))}
          </Select>
          <Button onClick={onGenerate} disabled={generating || !reservationId}>
            {generating && <Loader2 className="w-4 h-4 animate-spin" />}
            Générer
          </Button>
        </div>
      </div>

      {/* Création manuelle */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900">Ou facture manuelle</h3>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Client">
            <Select value={guestId} onChange={(e) => setGuestId(e.target.value)}>
              <option value="">— Aucun (vente directe) —</option>
              {guests.map((g) => (
                <option key={g.id} value={g.id}>{g.prenom} {g.nom}</option>
              ))}
            </Select>
          </Field>
          <Field label="Date d'échéance">
            <Input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Lignes de facture</h4>
            <Button size="sm" variant="secondary" onClick={addLine}>
              <Plus className="w-3 h-3" />
              Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            {lines.map((l, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-6">
                  <Input
                    placeholder="Libellé"
                    value={l.libelle}
                    onChange={(e) => update(idx, { libelle: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min={0.01}
                    step={0.5}
                    placeholder="Qté"
                    value={l.quantite}
                    onChange={(e) => update(idx, { quantite: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    placeholder="Prix unit."
                    value={l.prix_unitaire}
                    onChange={(e) => update(idx, { prix_unitaire: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-1">
                  <button
                    onClick={() => removeLine(idx)}
                    disabled={lines.length === 1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Taxe (XOF)">
            <Input type="number" min={0} value={taxe} onChange={(e) => setTaxe(Number(e.target.value))} />
          </Field>
          <Field label="Remise (XOF)">
            <Input type="number" min={0} value={remise} onChange={(e) => setRemise(Number(e.target.value))} />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="bg-slate-50 rounded-lg p-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Sous-total</span><span>{formatMoney(sousTotal)}</span></div>
          {taxe > 0 && <div className="flex justify-between"><span>Taxe</span><span>+ {formatMoney(taxe)}</span></div>}
          {remise > 0 && <div className="flex justify-between text-emerald-600"><span>Remise</span><span>- {formatMoney(remise)}</span></div>}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
            <span>Total</span><span>{formatMoney(total)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={() => router.back()}>Annuler</Button>
          <Button onClick={onSubmit} disabled={pending}>
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer la facture
          </Button>
        </div>
      </div>
    </div>
  );
}
