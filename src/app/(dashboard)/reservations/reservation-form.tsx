'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Calculator, BedDouble, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { formatMoney } from '@/lib/utils/format';
import { createReservation, updateReservation } from './actions';

type Room = { id: string; numero: string; etage: number | null; room_type: { id: string; libelle: string; prix_nuit: number } | null };
type RoomType = { id: string; libelle: string; prix_nuit: number };
type Guest = { id: string; nom: string; prenom: string; email: string | null; telephone: string | null };

type Initial = {
  id: string;
  guest_id: string;
  room_id: string | null;
  room_type_id: string | null;
  date_arrivee: string;
  date_depart: string;
  nb_adultes: number;
  nb_enfants: number;
  prix_total: number;
  acompte: number;
  source: string | null;
  notes: string | null;
};

export function ReservationForm({
  rooms,
  types,
  guests,
  initial,
  initialGuest
}: {
  rooms: Room[];
  types: RoomType[];
  guests: Guest[];
  initial?: Initial;
  initialGuest?: Guest;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [guestId, setGuestId] = useState<string>(initial?.guest_id ?? '');
  const [roomId, setRoomId] = useState<string>(initial?.room_id ?? '');
  const [roomTypeId, setRoomTypeId] = useState<string>(initial?.room_type_id ?? '');
  const [dateIn, setDateIn] = useState<string>(initial?.date_arrivee ?? '');
  const [dateOut, setDateOut] = useState<string>(initial?.date_depart ?? '');
  const [prixTotal, setPrixTotal] = useState<number>(initial?.prix_total ?? 0);
  const [acompte, setAcompte] = useState<number>(initial?.acompte ?? 0);

  // Nombre de nuitées (auto-calculé)
  const nights = useMemo(() => {
    if (!dateIn || !dateOut) return 0;
    const a = new Date(dateIn);
    const b = new Date(dateOut);
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
  }, [dateIn, dateOut]);

  // Prix unitaire effectif : chambre choisie > type choisi
  const selectedRoom = useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);
  const selectedType = useMemo(() => types.find((t) => t.id === roomTypeId), [types, roomTypeId]);

  const prixUnit = useMemo(() => {
    if (selectedRoom?.room_type?.prix_nuit) return Number(selectedRoom.room_type.prix_nuit);
    if (selectedType?.prix_nuit) return Number(selectedType.prix_nuit);
    return 0;
  }, [selectedRoom, selectedType]);

  // Indique d'où vient le prix unitaire pour l'UI
  const prixSource = selectedRoom?.room_type
    ? `Chambre ${selectedRoom.numero} (${selectedRoom.room_type.libelle})`
    : selectedType
      ? `Type ${selectedType.libelle}`
      : null;

  // Auto-sélection du room_type quand on choisit une chambre
  useEffect(() => {
    if (selectedRoom?.room_type?.id) {
      setRoomTypeId(selectedRoom.room_type.id);
    }
  }, [selectedRoom]);

  // ──────────────────────────────────────────────────────────────────
  // CALCUL AUTOMATIQUE DU PRIX TOTAL
  // Recalculé à chaque changement de chambre / type / dates.
  // L'utilisateur peut quand même override manuellement après coup
  // (le flag userOverride empêche l'écrasement suivant).
  // ──────────────────────────────────────────────────────────────────
  const userOverrideRef = useRef(false);

  useEffect(() => {
    if (userOverrideRef.current) return;
    const computed = prixUnit * nights;
    setPrixTotal(computed);
  }, [prixUnit, nights]);

  function onPrixTotalChange(v: number) {
    userOverrideRef.current = true;
    setPrixTotal(v);
  }

  function resetPrixTotal() {
    userOverrideRef.current = false;
    setPrixTotal(prixUnit * nights);
  }

  const restantDu = Math.max(0, prixTotal - acompte);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = initial
        ? await updateReservation(initial.id, fd)
        : await createReservation(fd);
      if (r.ok) {
        toast.success(initial ? 'Réservation mise à jour' : 'Réservation créée');
        const target = initial ? `/reservations/${initial.id}` :
          'data' in r && r.data ? `/reservations/${r.data.id}` : '/reservations';
        router.push(target);
      } else toast.error(r.error);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 max-w-3xl space-y-6"
    >
      {/* ──── Bloc CLIENT ──── */}
      {!initial && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Client</h3>
            <div className="flex bg-slate-100 rounded-lg p-0.5 text-sm">
              <button type="button" onClick={() => setGuestId('')}
                className={`px-3 py-1 rounded-md font-medium transition ${!guestId ? 'bg-white shadow text-brand-700' : 'text-slate-500'}`}>
                Nouveau client
              </button>
              <button type="button" onClick={() => setGuestId(guests[0]?.id ?? '')} disabled={guests.length === 0}
                className={`px-3 py-1 rounded-md font-medium transition ${guestId ? 'bg-white shadow text-brand-700' : 'text-slate-500'} disabled:opacity-40`}>
                Client existant
              </button>
            </div>
          </div>

          {guestId ? (
            <>
              <Field label="Sélectionner un client" required>
                <Select name="guest_id" value={guestId} onChange={(e) => setGuestId(e.target.value)} required>
                  {guests.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.prenom} {g.nom}{g.telephone ? ` · ${g.telephone}` : ''}{g.email ? ` · ${g.email}` : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <input type="hidden" name="nom" value={guests.find((g) => g.id === guestId)?.nom ?? ''} />
              <input type="hidden" name="prenom" value={guests.find((g) => g.id === guestId)?.prenom ?? ''} />
            </>
          ) : (
            <>
              <input type="hidden" name="guest_id" value="" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom" required><Input name="prenom" required maxLength={100} placeholder="Jean" /></Field>
                <Field label="Nom" required><Input name="nom" required maxLength={100} placeholder="Dupont" /></Field>
                <Field label="Email"><Input name="email" type="email" placeholder="jean.dupont@email.com" /></Field>
                <Field label="Téléphone"><Input name="telephone" placeholder="+225 07 00 00 00 00" /></Field>
                <Field label="Nationalité"><Input name="nationalite" placeholder="Ivoirienne" /></Field>
                <Field label="Date de naissance"><Input name="date_naissance" type="date" /></Field>
                <Field label="Type de pièce">
                  <Select name="type_piece" defaultValue="">
                    <option value="">—</option>
                    <option value="CNI">CNI</option>
                    <option value="Passeport">Passeport</option>
                    <option value="Permis">Permis de conduire</option>
                    <option value="Carte consulaire">Carte consulaire</option>
                  </Select>
                </Field>
                <Field label="N° de pièce"><Input name="numero_piece" placeholder="C012345678" /></Field>
              </div>
              <Field label="Adresse"><Textarea name="adresse" placeholder="Adresse complète" /></Field>
            </>
          )}
        </section>
      )}

      {initial && initialGuest && (
        <section>
          <h3 className="font-semibold text-slate-900">Client</h3>
          <p className="text-sm text-slate-600">
            {initialGuest.prenom} {initialGuest.nom}
            {initialGuest.telephone && ` · ${initialGuest.telephone}`}
          </p>
        </section>
      )}

      {/* ──── Bloc DATES & CHAMBRE ──── */}
      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-brand-600" />
          Séjour
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Arrivée" required>
            <Input name="date_arrivee" type="date" value={dateIn}
              onChange={(e) => setDateIn(e.target.value)} required />
          </Field>
          <Field label="Départ" required>
            <Input name="date_depart" type="date" value={dateOut}
              onChange={(e) => setDateOut(e.target.value)} required />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Adultes" required>
            <Input name="nb_adultes" type="number" min={1} max={10}
              defaultValue={initial?.nb_adultes ?? 1} required />
          </Field>
          <Field label="Enfants">
            <Input name="nb_enfants" type="number" min={0} max={10}
              defaultValue={initial?.nb_enfants ?? 0} />
          </Field>
        </div>

        <Field label="Chambre" hint="Optionnel — peut être assignée plus tard">
          <Select name="room_id" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">— Non assignée —</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Ch. {r.numero}
                {r.room_type ? ` · ${r.room_type.libelle} · ${Number(r.room_type.prix_nuit).toLocaleString('fr-FR')} FCFA/nuit` : ''}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Type souhaité (si pas de chambre fixe)">
          <Select name="room_type_id" value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)}>
            <option value="">—</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.libelle} · {Number(t.prix_nuit).toLocaleString('fr-FR')} FCFA/nuit
              </option>
            ))}
          </Select>
        </Field>
      </section>

      {/* ──── Bloc TARIFICATION AUTOMATIQUE ──── */}
      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-600" />
          Tarification automatique
        </h3>

        <div className="bg-gradient-to-br from-brand-50 to-emerald-50 border border-brand-200 rounded-xl p-4 space-y-3">
          {/* Prix unitaire */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-700 flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-slate-500" />
              Prix par nuit
            </span>
            <span className="font-bold text-slate-900">
              {prixUnit > 0 ? formatMoney(prixUnit) : <span className="text-slate-400 italic font-normal text-xs">Sélectionnez une chambre ou un type</span>}
            </span>
          </div>
          {prixSource && (
            <div className="text-[11px] text-slate-500 -mt-2 pl-5">Source : {prixSource}</div>
          )}

          {/* Nombre de nuitées */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-700">Nombre de nuitées</span>
            <span className="font-bold text-slate-900">
              {nights > 0 ? `${nights} nuit${nights > 1 ? 's' : ''}` : <span className="text-slate-400 italic font-normal text-xs">Choisissez les dates</span>}
            </span>
          </div>

          {/* Calcul détaillé */}
          {prixUnit > 0 && nights > 0 && (
            <div className="text-xs text-slate-600 pl-1 border-l-2 border-brand-300">
              <span className="font-mono">{prixUnit.toLocaleString('fr-FR')} × {nights} = {(prixUnit * nights).toLocaleString('fr-FR')} FCFA</span>
            </div>
          )}

          {/* Total */}
          <div className="border-t border-brand-200 pt-3 flex items-center justify-between">
            <span className="font-bold text-slate-900">Prix total</span>
            <span className="text-2xl font-bold text-brand-700">{formatMoney(prixTotal)}</span>
          </div>

          {/* Override manuel */}
          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <Field label="Modifier manuellement le total (optionnel)">
              <Input
                name="prix_total"
                type="number"
                min={0}
                step={500}
                value={prixTotal}
                onChange={(e) => onPrixTotalChange(Number(e.target.value))}
                required
              />
            </Field>
            {userOverrideRef.current && prixUnit > 0 && nights > 0 && (
              <button
                type="button"
                onClick={resetPrixTotal}
                className="text-xs px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
                title="Recalculer automatiquement"
              >
                ↻ Auto
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Acompte (XOF)" hint={`Restant dû : ${formatMoney(restantDu)}`}>
            <Input
              name="acompte"
              type="number"
              min={0}
              max={prixTotal}
              step={500}
              value={acompte}
              onChange={(e) => setAcompte(Number(e.target.value))}
            />
          </Field>
          <Field label="Source" hint="Booking, Airbnb, walk-in…">
            <Input name="source" defaultValue={initial?.source ?? ''} />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea name="notes" defaultValue={initial?.notes ?? ''} />
        </Field>
      </section>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? 'Enregistrer' : 'Créer la réservation'}
        </Button>
      </div>
    </form>
  );
}
