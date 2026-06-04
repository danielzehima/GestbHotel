import { cn } from '@/lib/utils/cn';
import type { OrderStatus } from '@/types/database';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  nouvelle: 'Nouvelle',
  en_preparation: 'En préparation',
  prete: 'Prête',
  servie: 'Servie',
  annulee: 'Annulée'
};

const COLORS: Record<OrderStatus, string> = {
  nouvelle: 'bg-slate-100 text-slate-700 border-slate-200',
  en_preparation: 'bg-amber-100 text-amber-700 border-amber-200',
  prete: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  servie: 'bg-brand-100 text-brand-700 border-brand-200',
  annulee: 'bg-red-100 text-red-700 border-red-200'
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium border', COLORS[status], className)}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
