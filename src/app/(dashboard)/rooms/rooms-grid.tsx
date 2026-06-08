'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatMoney } from '@/lib/utils/format';
import { RoomStatusBadge, ROOM_STATUS_LABELS } from '@/components/ui/room-status-badge';
import { changeRoomStatus } from './actions';
import type { Room, RoomType } from '@/types/domain';
import type { RoomStatus } from '@/types/database';

const STATUS_FILTERS: { value: RoomStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'disponible', label: ROOM_STATUS_LABELS.disponible },
  { value: 'occupee', label: ROOM_STATUS_LABELS.occupee },
  { value: 'nettoyage', label: ROOM_STATUS_LABELS.nettoyage },
  { value: 'maintenance', label: ROOM_STATUS_LABELS.maintenance },
  { value: 'hors_service', label: ROOM_STATUS_LABELS.hors_service }
];

const STATUSES: RoomStatus[] = ['disponible', 'occupee', 'nettoyage', 'maintenance', 'hors_service'];

export function RoomsGrid({
  rooms,
  canManage,
  currentStatus
}: {
  rooms: Room[];
  types: RoomType[];
  canManage: boolean;
  currentStatus?: RoomStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(roomId: string, statut: RoomStatus) {
    startTransition(async () => {
      const result = await changeRoomStatus(roomId, statut);
      if (result.ok) toast.success('Statut mis à jour');
      else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = (currentStatus ?? 'all') === f.value;
          const href = f.value === 'all' ? '/rooms' : `/rooms?statut=${f.value}`;
          return (
            <Link
              key={f.value}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition',
                active
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
          Aucune chambre dans ce statut.
        </div>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">Ch. {room.numero}</div>
                <div className="text-xs text-slate-500">
                  {room.room_type?.libelle ?? 'Sans type'}
                  {room.etage != null && ` · Étage ${room.etage}`}
                </div>
              </div>
              {canManage && (
                <Link
                  href={`/rooms/${room.id}/edit`}
                  className="text-slate-400 hover:text-slate-600"
                  title="Modifier"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <RoomStatusBadge status={room.statut} />
              {room.room_type && (
                <span className="text-xs font-medium text-slate-500">
                  {formatMoney(Number(room.room_type.prix_nuit))}/nuit
                </span>
              )}
            </div>

            <div className="mt-3">
              <select
                value={room.statut}
                disabled={isPending}
                onChange={(e) => handleStatusChange(room.id, e.target.value as RoomStatus)}
                className="w-full text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 focus:border-brand-500 outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ROOM_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
