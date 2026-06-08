'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Receipt, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createInvoiceFromReservation } from '@/app/(dashboard)/invoices/actions';

export function GenerateInvoiceButton({
  reservationId,
  existingInvoiceId
}: {
  reservationId: string;
  existingInvoiceId: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (existingInvoiceId) {
    return (
      <Link href={`/invoices/${existingInvoiceId}`}>
        <Button variant="secondary">
          <FileText className="w-4 h-4" />
          Voir la facture
        </Button>
      </Link>
    );
  }

  function onGenerate() {
    start(async () => {
      const r = await createInvoiceFromReservation(reservationId);
      if (r.ok && 'data' in r && r.data) {
        toast.success('Facture générée');
        router.push(`/invoices/${r.data.id}`);
      } else if (!r.ok) {
        toast.error(r.error);
      }
    });
  }

  return (
    <Button onClick={onGenerate} disabled={pending}>
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
      Générer la facture
    </Button>
  );
}
