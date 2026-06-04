'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cancelInvoice } from '../actions';

export function CancelInvoice({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    if (!confirm('Annuler cette facture ? Action irréversible.')) return;
    start(async () => {
      const r = await cancelInvoice(id);
      if (r.ok) toast.success('Facture annulée');
      else toast.error(r.error);
    });
  }
  return (
    <Button variant="danger" onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
      Annuler
    </Button>
  );
}
