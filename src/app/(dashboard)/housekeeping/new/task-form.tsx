'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { createTask } from '../actions';

type Room = { id: string; numero: string; statut: string };
type Staff = { id: string; nom: string; prenom: string };

export function TaskForm({ rooms, staff }: { rooms: Room[]; staff: Staff[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await createTask(fd);
      if (r.ok) {
        toast.success('Tâche créée');
        router.push('/housekeeping');
      } else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-4">
      <Field label="Chambre" required>
        <Select name="room_id" required defaultValue="">
          <option value="" disabled>— Sélectionner —</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              Ch. {r.numero} ({r.statut})
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date prévue" required>
          <Input name="date_prevue" type="date" defaultValue={today} required />
        </Field>
        <Field label="Priorité">
          <Select name="priorite" defaultValue="1">
            <option value="1">Normale</option>
            <option value="2">Élevée</option>
            <option value="3">Urgente</option>
          </Select>
        </Field>
      </div>

      <Field label="Agent assigné">
        <Select name="assignee_id" defaultValue="">
          <option value="">— Non assignée —</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.prenom} {s.nom}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Description / consignes">
        <Textarea name="description" placeholder="Nettoyage approfondi, changer les draps, vérifier mini-bar…" />
      </Field>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Créer la tâche
        </Button>
      </div>
    </form>
  );
}
