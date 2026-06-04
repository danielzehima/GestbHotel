'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { createShift } from '../actions';

const PRESETS = {
  matin: { heure_debut: '06:00', heure_fin: '14:00' },
  apres_midi: { heure_debut: '14:00', heure_fin: '22:00' },
  nuit: { heure_debut: '22:00', heure_fin: '06:00' },
  journee: { heure_debut: '08:00', heure_fin: '17:00' }
} as const;

type Staff = { id: string; nom: string; prenom: string; role: string };

export function ShiftForm({ staff }: { staff: Staff[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [type, setType] = useState<keyof typeof PRESETS>('journee');
  const today = new Date().toISOString().slice(0, 10);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await createShift(fd);
      if (r.ok) {
        toast.success('Shift créé');
        router.push('/shifts');
      } else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-4">
      <Field label="Employé" required>
        <Select name="profile_id" required defaultValue="">
          <option value="" disabled>— Sélectionner —</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.prenom} {s.nom} ({s.role})
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" required>
          <Input name="date" type="date" defaultValue={today} required />
        </Field>
        <Field label="Type" required>
          <Select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as keyof typeof PRESETS)}
            required
          >
            <option value="matin">Matin</option>
            <option value="apres_midi">Après-midi</option>
            <option value="nuit">Nuit</option>
            <option value="journee">Journée</option>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Heure début" required>
          <Input name="heure_debut" type="time" defaultValue={PRESETS[type].heure_debut} required />
        </Field>
        <Field label="Heure fin" required>
          <Input name="heure_fin" type="time" defaultValue={PRESETS[type].heure_fin} required />
        </Field>
      </div>

      <Field label="Notes">
        <Textarea name="notes" placeholder="Remplacement, zone d'affectation…" />
      </Field>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Créer le shift
        </Button>
      </div>
    </form>
  );
}
