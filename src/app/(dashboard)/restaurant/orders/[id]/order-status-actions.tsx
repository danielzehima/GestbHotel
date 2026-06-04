'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { ChefHat, Bell, Check, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateOrderStatus } from '../actions';
import type { OrderStatus } from '@/types/database';

export function OrderStatusActions({ id, status }: { id: string; status: OrderStatus }) {
  const [pending, start] = useTransition();

  function set(s: OrderStatus, msg: string) {
    start(async () => {
      const r = await updateOrderStatus(id, s);
      if (r.ok) toast.success(msg);
      else toast.error(r.error ?? 'Erreur');
    });
  }

  const Loader = pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null;

  if (status === 'nouvelle') {
    return (
      <div className="flex gap-2">
        <Button onClick={() => set('en_preparation', 'En préparation')} disabled={pending}>
          {Loader ?? <ChefHat className="w-4 h-4" />}
          Commencer
        </Button>
        <Button variant="danger" onClick={() => { if (confirm('Annuler ?')) set('annulee', 'Annulée'); }} disabled={pending}>
          <XCircle className="w-4 h-4" />
          Annuler
        </Button>
      </div>
    );
  }
  if (status === 'en_preparation') {
    return (
      <Button onClick={() => set('prete', 'Prête à servir')} disabled={pending}>
        {Loader ?? <Bell className="w-4 h-4" />}
        Marquer prête
      </Button>
    );
  }
  if (status === 'prete') {
    return (
      <Button onClick={() => set('servie', 'Servie')} disabled={pending}>
        {Loader ?? <Check className="w-4 h-4" />}
        Marquer servie
      </Button>
    );
  }
  return null;
}
