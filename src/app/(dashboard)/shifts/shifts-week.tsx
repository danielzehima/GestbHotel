'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { deleteShift } from './actions';
import type { UserRole } from '@/types/database';

type Shift = {
  id: string;
  profile_id: string;
  date: string;
  type: 'matin' | 'apres_midi' | 'nuit' | 'journee';
  heure_debut: string;
  heure_fin: string;
  notes: string | null;
  profile: { nom: string; prenom: string; role: UserRole } | null;
};

type Staff = { id: string; nom: string; prenom: string; role: UserRole };

const TYPE_COLORS: Record<Shift['type'], string> = {
  matin: 'bg-sky-100 text-sky-800 border-sky-200',
  apres_midi: 'bg-amber-100 text-amber-800 border-amber-200',
  nuit: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  journee: 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

const TYPE_LABELS: Record<Shift['type'], string> = {
  matin: 'Matin',
  apres_midi: 'A.midi',
  nuit: 'Nuit',
  journee: 'Journée'
};

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function addDays(date: string, n: number) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function ShiftsWeek({
  shifts,
  staff,
  monday,
  isAdmin
}: {
  shifts: Shift[];
  staff: Staff[];
  monday: string;
  isAdmin: boolean;
}) {
  const [pending, start] = useTransition();
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  // Regrouper par profile_id
  const byProfile = new Map<string, { name: string; role: UserRole; shifts: Shift[] }>();
  staff.forEach((s) => {
    byProfile.set(s.id, { name: `${s.prenom} ${s.nom}`, role: s.role, shifts: [] });
  });
  shifts.forEach((s) => {
    const entry = byProfile.get(s.profile_id);
    if (entry) entry.shifts.push(s);
  });

  // Filtrer profils sans shift cette semaine pour réduire le bruit
  const visible = Array.from(byProfile.entries()).filter(([, v]) => v.shifts.length > 0);

  function onDelete(id: string) {
    if (!confirm('Supprimer ce shift ?')) return;
    start(async () => {
      const r = await deleteShift(id);
      if (r.ok) toast.success('Shift supprimé');
      else toast.error(r.error);
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
      <table className="w-full min-w-[800px] text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-40">
              Employé
            </th>
            {DAYS.map((d, i) => {
              const date = week[i];
              return (
                <th key={d} className="text-center px-2 py-3 text-xs font-semibold text-slate-500">
                  {d}
                  <div className="text-[10px] font-normal text-slate-400">{date.slice(-2)}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visible.map(([profileId, info]) => (
            <tr key={profileId} className="hover:bg-slate-50">
              <td className="px-4 py-2 font-medium">
                {info.name}
                <div className="text-xs text-slate-400 capitalize">{info.role}</div>
              </td>
              {week.map((day) => {
                const dayShifts = info.shifts.filter((s) => s.date === day);
                return (
                  <td key={day} className="px-1 py-2 align-top">
                    <div className="space-y-1">
                      {dayShifts.map((s) => (
                        <div
                          key={s.id}
                          className={cn(
                            'px-1.5 py-1 rounded border text-xs flex items-center justify-between gap-1',
                            TYPE_COLORS[s.type]
                          )}
                          title={s.notes ?? ''}
                        >
                          <div>
                            <div className="font-semibold">{TYPE_LABELS[s.type]}</div>
                            <div className="text-[10px] opacity-80">
                              {s.heure_debut.slice(0, 5)}-{s.heure_fin.slice(0, 5)}
                            </div>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => onDelete(s.id)}
                              disabled={pending}
                              className="hover:bg-white/50 rounded p-0.5"
                              title="Supprimer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
