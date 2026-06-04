import { cn } from '@/lib/utils/cn';

export type InvoiceStatus = 'brouillon' | 'emise' | 'partiellement_payee' | 'payee' | 'annulee';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  brouillon: 'Brouillon',
  emise: 'Émise',
  partiellement_payee: 'Partielle',
  payee: 'Payée',
  annulee: 'Annulée'
};

const COLORS: Record<InvoiceStatus, string> = {
  brouillon: 'bg-slate-100 text-slate-700 border-slate-200',
  emise: 'bg-amber-100 text-amber-700 border-amber-200',
  partiellement_payee: 'bg-orange-100 text-orange-700 border-orange-200',
  payee: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  annulee: 'bg-red-100 text-red-700 border-red-200'
};

export function InvoiceStatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium border', COLORS[status], className)}>
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}
