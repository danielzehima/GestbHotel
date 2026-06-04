import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import type { ReservationStatus } from '@/types/database';

type Room = {
  id: string;
  numero: string;
  etage: number | null;
  room_type: { libelle: string } | null;
};

type Reservation = {
  id: string;
  reference: string;
  statut: ReservationStatus;
  date_arrivee: string;
  date_depart: string;
  room_id: string | null;
  guest: { nom: string; prenom: string } | null;
};

const STATUS_COLOR: Record<ReservationStatus, string> = {
  en_attente: 'bg-slate-400',
  confirmee: 'bg-brand-500',
  check_in: 'bg-emerald-500',
  check_out: 'bg-amber-500',
  annulee: 'bg-red-400',
  no_show: 'bg-orange-500'
};

const DAY_WIDTH = 36; // px

function clampDate(iso: string, min: string, max: string) {
  if (iso < min) return min;
  if (iso > max) return max;
  return iso;
}

function diffDays(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function CalendarGrid({
  year,
  month,
  startStr,
  endStr,
  daysInMonth,
  rooms,
  reservations
}: {
  year: number;
  month: number; // 0-based
  startStr: string;
  endStr: string;
  daysInMonth: number;
  rooms: Room[];
  reservations: Reservation[];
}) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(Date.UTC(year, month, i + 1));
    return {
      day: i + 1,
      iso: d.toISOString().slice(0, 10),
      weekday: d.getUTCDay() // 0 = dim
    };
  });

  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
        Aucune chambre. Créez d'abord vos chambres dans la section <strong>Chambres</strong>.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Header jours */}
        <div className="flex sticky top-0 bg-white z-10 border-b border-slate-200">
          <div className="w-32 shrink-0 px-3 py-2 text-xs font-semibold text-slate-500 uppercase border-r border-slate-200">
            Chambre
          </div>
          {days.map((d) => {
            const isWeekend = d.weekday === 0 || d.weekday === 6;
            const isToday = d.iso === todayStr;
            return (
              <div
                key={d.iso}
                style={{ width: DAY_WIDTH }}
                className={cn(
                  'shrink-0 text-center py-2 text-xs border-r border-slate-100',
                  isWeekend && 'bg-slate-50',
                  isToday && 'bg-brand-50 text-brand-700 font-bold'
                )}
              >
                {d.day}
              </div>
            );
          })}
        </div>

        {/* Lignes chambres */}
        {rooms.map((room) => {
          const roomRes = reservations.filter((r) => r.room_id === room.id);
          return (
            <div key={room.id} className="flex border-b border-slate-100 relative h-12 hover:bg-slate-50">
              <div className="w-32 shrink-0 px-3 py-2 border-r border-slate-200 flex flex-col justify-center">
                <div className="font-semibold text-sm">Ch. {room.numero}</div>
                {room.room_type && (
                  <div className="text-xs text-slate-400 truncate">{room.room_type.libelle}</div>
                )}
              </div>

              <div className="relative flex" style={{ width: daysInMonth * DAY_WIDTH }}>
                {days.map((d) => {
                  const isWeekend = d.weekday === 0 || d.weekday === 6;
                  return (
                    <div
                      key={d.iso}
                      style={{ width: DAY_WIDTH }}
                      className={cn(
                        'shrink-0 border-r border-slate-100',
                        isWeekend && 'bg-slate-50/50'
                      )}
                    />
                  );
                })}

                {roomRes.map((r) => {
                  const startVisible = clampDate(r.date_arrivee, startStr, endStr);
                  const endVisible = clampDate(r.date_depart, startStr, endStr);
                  const startDay = diffDays(startStr, startVisible);
                  const span = Math.max(1, diffDays(startVisible, endVisible));
                  return (
                    <Link
                      key={r.id}
                      href={`/reservations/${r.id}`}
                      title={`${r.reference} — ${r.guest?.prenom ?? ''} ${r.guest?.nom ?? ''}`}
                      className={cn(
                        'absolute top-1.5 bottom-1.5 rounded-md text-white text-xs px-2 flex items-center font-medium truncate hover:opacity-90 transition',
                        STATUS_COLOR[r.statut]
                      )}
                      style={{
                        left: startDay * DAY_WIDTH + 2,
                        width: span * DAY_WIDTH - 4
                      }}
                    >
                      {r.guest?.prenom?.charAt(0)}. {r.guest?.nom}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3 p-3 border-t border-slate-100 text-xs">
        {(['confirmee', 'check_in', 'check_out'] as ReservationStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={cn('w-3 h-3 rounded', STATUS_COLOR[s])} />
            <span className="text-slate-600 capitalize">{s.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
