import { cn } from '@/lib/utils/cn';
import type { ReservationStatus } from '@/types/database';

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  check_in: 'Arrivée',
  check_out: 'Départ',
  annulee: 'Annulée',
  no_show: 'No show'
};

const colors: Record<ReservationStatus, string> = {
  en_attente: 'bg-slate-100 text-slate-700 border-slate-200',
  confirmee: 'bg-brand-100 text-brand-700 border-brand-200',
  check_in: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  check_out: 'bg-amber-100 text-amber-700 border-amber-200',
  annulee: 'bg-red-100 text-red-700 border-red-200',
  no_show: 'bg-orange-100 text-orange-700 border-orange-200'
};

export function ReservationStatusBadge({
  status,
  className
}: {
  status: ReservationStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 rounded text-xs font-medium border',
        colors[status],
        className
      )}
    >
      {RESERVATION_STATUS_LABELS[status]}
    </span>
  );
}
