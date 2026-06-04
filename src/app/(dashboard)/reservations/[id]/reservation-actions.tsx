'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { LogIn, LogOut, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkIn, checkOut, cancelReservation } from '../actions';
import type { ReservationStatus } from '@/types/database';

export function ReservationActions({ id, status }: { id: string; status: ReservationStatus }) {
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(success);
      else toast.error(r.error ?? 'Erreur');
    });
  }

  const Spin = pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null;

  if (status === 'confirmee' || status === 'en_attente') {
    return (
      <div className="flex gap-2">
        <Button onClick={() => run(() => checkIn(id), 'Arrivée enregistrée')} disabled={pending}>
          {Spin ?? <LogIn className="w-4 h-4" />}
          Check-in
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (confirm('Annuler cette réservation ?'))
              run(() => cancelReservation(id), 'Réservation annulée');
          }}
          disabled={pending}
        >
          <XCircle className="w-4 h-4" />
          Annuler
        </Button>
      </div>
    );
  }

  if (status === 'check_in') {
    return (
      <Button onClick={() => run(() => checkOut(id), 'Départ enregistré')} disabled={pending}>
        {Spin ?? <LogOut className="w-4 h-4" />}
        Check-out
      </Button>
    );
  }

  return null;
}
