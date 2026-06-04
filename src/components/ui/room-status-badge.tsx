import { cn } from '@/lib/utils/cn';
import type { RoomStatus } from '@/types/database';

const labels: Record<RoomStatus, string> = {
  disponible: 'Disponible',
  occupee: 'Occupée',
  nettoyage: 'En nettoyage',
  maintenance: 'Maintenance',
  hors_service: 'Hors service'
};

const colors: Record<RoomStatus, string> = {
  disponible: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  occupee: 'bg-brand-100 text-brand-700 border-brand-200',
  nettoyage: 'bg-amber-100 text-amber-700 border-amber-200',
  maintenance: 'bg-orange-100 text-orange-700 border-orange-200',
  hors_service: 'bg-slate-200 text-slate-700 border-slate-300'
};

export function RoomStatusBadge({ status, className }: { status: RoomStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 rounded text-xs font-medium border',
        colors[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}

export const ROOM_STATUS_LABELS = labels;
